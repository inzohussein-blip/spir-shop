import { readFileSync } from "fs"
import { join } from "path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createPriceListsWorkflow,
  createProductsWorkflow,
  updatePriceListsWorkflow,
  updateProductsWorkflow,
  updateStoresWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import type { AppBlock } from "../lib/app-blocks"
import { defaultTenant } from "../lib/tenant"
import { publishAppLayoutWorkflow } from "../workflows/app-content"

/**
 * Demo catalog v2 for the trial store (DEMO data: replace with real products,
 * prices and photos before launch). Safe to run on every deploy:
 *  - photos: rendered product shots (demo-assets/v2) replace the old flat
 *    illustrations, only on products still showing no photo or an old demo one;
 *    photos uploaded from the admin are never touched
 *  - new products from demo-assets/catalog.json, created once (by handle)
 *  - "عروض الأسبوع": a 7-day sale, renewed whenever it has ended
 *  - a shop-style home page, published once (store metadata demo_home_layout)
 *
 * Run: npx medusa exec ./src/scripts/seed-demo-catalog.ts
 */

type Entry = {
  handle: string
  title?: string
  category?: string
  price?: number
  sale?: number
  description?: string
  shades?: Record<string, string>
}
type Catalog = { existing: Entry[]; new: Entry[]; banners: { file: string; link: string }[] }

const ASSETS = join(__dirname, "demo-assets")
const OLD_DEMO_PHOTOS = [
  "body-creme.jpg", "cleanser-pump.jpg", "deodorant.jpg", "eyeshadow-palette.jpg", "foundation.jpg", "gel-cleanser.jpg",
  "hyaluronic-dropper.jpg", "lip-cream.jpg", "mascara.jpg", "micellar.jpg", "moisturizer-jar.jpg", "serum-dropper.jpg",
  "shampoo.jpg", "sunscreen-tube.jpg",
]
/** Discounts on existing demo products in the weekly sale (fraction off). */
const EXISTING_DEALS: Record<string, number> = {
  "vitamin-c-serum": 0.2,
  "cerave-moisturizing-cream": 0.15,
  "maybelline-fit-me": 0.2,
  "nivea-creme": 0.1,
  "ordinary-niacinamide": 0.2,
  "loreal-micellar-water": 0.25,
}
const SALE_TITLE = "عروض الأسبوع"
const HOME_LAYOUT_VERSION = "shop-v1"

export default async function seedDemoCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const catalog = JSON.parse(readFileSync(join(ASSETS, "catalog.json"), "utf8")) as Catalog
  const tenant = await defaultTenant(container)

  // Photos are uploaded once per run and only when something needs them
  const uploaded = new Map<string, string>()
  const upload = async (names: string[]) => {
    const todo = names.filter((n) => !uploaded.has(n))
    if (!todo.length) return
    const { result } = await uploadFilesWorkflow(container).run({
      input: {
        files: todo.map((name) => ({
          filename: `demo-v2-${name}`,
          mimeType: "image/jpeg",
          content: readFileSync(join(ASSETS, "v2", name)).toString("base64"),
          access: "public" as const,
        })),
      },
    })
    todo.forEach((n, i) => uploaded.set(n, result[i].url))
  }
  const photos = (handle: string) => [`${handle}-1.jpg`, `${handle}-2.jpg`]

  /* ------------------------- photos of existing products ------------------------- */
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail"],
    filters: { handle: catalog.existing.map((e) => e.handle) },
  })
  const needPhotos = existing.filter((p) => !p.thumbnail || OLD_DEMO_PHOTOS.some((n) => p.thumbnail!.endsWith(n)))
  if (needPhotos.length) {
    await upload(needPhotos.flatMap((p) => photos(p.handle)))
    await updateProductsWorkflow(container).run({
      input: {
        products: needPhotos.map((p) => ({
          id: p.id,
          thumbnail: uploaded.get(photos(p.handle)[0]),
          images: photos(p.handle).map((n) => ({ url: uploaded.get(n)! })),
        })),
      },
    })
    logger.info(`Demo photos v2 on ${needPhotos.length} products`)
  }

  /* --------------------------------- new products -------------------------------- */
  const { data: present } = await query.graph({ entity: "product", fields: ["handle"], filters: { handle: catalog.new.map((e) => e.handle) } })
  const have = new Set(present.map((p) => p.handle))
  const toCreate = catalog.new.filter((e) => !have.has(e.handle))
  if (toCreate.length) {
    const [{ data: profiles }, { data: categories }] = await Promise.all([
      query.graph({ entity: "shipping_profile", fields: ["id"] }),
      query.graph({ entity: "product_category", fields: ["id", "name", "parent_category_id"] }),
    ])
    const categoryId = (name?: string) => categories.find((c) => c.name === name && !c.parent_category_id)?.id
    await upload(toCreate.flatMap((e) => photos(e.handle)))
    await createProductsWorkflow(container).run({
      input: {
        products: toCreate.map((e) => {
          const values = e.shades ? Object.keys(e.shades) : ["قياسي"]
          const optionTitle = e.shades ? "الدرجة" : "الحجم"
          const cat = categoryId(e.category)
          return {
            title: e.title!,
            handle: e.handle,
            description: e.description,
            status: ProductStatus.PUBLISHED,
            category_ids: cat ? [cat] : [],
            shipping_profile_id: profiles[0].id,
            thumbnail: uploaded.get(photos(e.handle)[0]),
            images: photos(e.handle).map((n) => ({ url: uploaded.get(n)! })),
            options: [{ title: optionTitle, values }],
            metadata: e.shades ? { swatches: e.shades, demo: true } : { demo: true },
            variants: values.map((v) => ({
              title: v,
              sku: `${e.handle}-${v}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 60),
              options: { [optionTitle]: v },
              manage_inventory: false,
              prices: [{ currency_code: "iqd", amount: e.price! }],
            })),
            sales_channels: [{ id: tenant.sales_channel_id }],
          }
        }),
      },
    })
    logger.info(`Demo products created: ${toCreate.length}`)
  }

  /* ------------------------------------ sale ------------------------------------- */
  const now = Date.now()
  const week = new Date(now + 7 * 24 * 3600 * 1000).toISOString()
  const { data: lists } = await query.graph({ entity: "price_list", fields: ["id", "title", "ends_at"], filters: { title: SALE_TITLE } })
  if (lists[0]) {
    if (lists[0].ends_at && new Date(lists[0].ends_at).getTime() < now + 24 * 3600 * 1000) {
      await updatePriceListsWorkflow(container).run({ input: { price_lists_data: [{ id: lists[0].id, starts_at: new Date(now).toISOString(), ends_at: week, status: "active" }] } })
      logger.info(`Sale "${SALE_TITLE}" renewed for 7 days`)
    }
  } else {
    const saleOf: Record<string, (base: number) => number> = {}
    for (const e of catalog.new) if (e.sale) saleOf[e.handle] = () => e.sale!
    for (const [h, off] of Object.entries(EXISTING_DEALS)) saleOf[h] = (base) => Math.round((base * (1 - off)) / 250) * 250
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["handle", "variants.id", "variants.prices.amount", "variants.prices.currency_code"],
      filters: { handle: Object.keys(saleOf) },
    })
    const prices = products.flatMap((p) =>
      (p.variants ?? []).flatMap((v) => {
        const base = ((v as unknown as { prices?: { amount: number; currency_code: string }[] }).prices ?? []).find((x) => x.currency_code === "iqd")
        if (!v || !base) return []
        return [{ variant_id: v.id, currency_code: "iqd", amount: saleOf[p.handle](base.amount) }]
      })
    )
    if (prices.length) {
      await createPriceListsWorkflow(container).run({
        input: {
          price_lists_data: [
            { title: SALE_TITLE, description: "Demo weekly sale (renewed on deploy while demo data is on)", status: "active", starts_at: new Date(now).toISOString(), ends_at: week, prices },
          ],
        },
      })
      logger.info(`Sale "${SALE_TITLE}" created: ${prices.length} prices`)
    }
  }

  /* ---------------------------------- home page ---------------------------------- */
  const storeService = container.resolve(Modules.STORE)
  const [store] = await storeService.listStores({}, { take: 1 })
  const meta = (store?.metadata ?? {}) as Record<string, unknown>
  if (store && meta.demo_home_layout !== HOME_LAYOUT_VERSION) {
    await upload(catalog.banners.map((b) => b.file))
    const blocks: AppBlock[] = [
      { id: "categories", type: "category_chips", props: { title: "" } },
      {
        id: "banners",
        type: "hero_carousel",
        props: { interval: 4, slides: catalog.banners.map((b) => ({ title: "", subtitle: "", image_url: uploaded.get(b.file), link: b.link })) },
      },
      { id: "trust", type: "trust_strip", props: {} },
      { id: "deals", type: "flash_sale", props: { title: "عروض الأسبوع", limit: 10 } },
      { id: "bestsellers", type: "product_carousel", props: { title: "الأكثر طلباً", source: "all", limit: 10 } },
      { id: "brands", type: "brand_strip", props: { title: "ماركات عالمية" } },
      { id: "feed", type: "product_feed", props: { title: "مقترحة لكِ" } },
    ]
    await publishAppLayoutWorkflow(container).run({ input: { tenant_id: tenant.id, page: "home", blocks } })
    await updateStoresWorkflow(container).run({ input: { selector: { id: store.id }, update: { metadata: { ...meta, demo_home_layout: HOME_LAYOUT_VERSION } } } })
    logger.info("Shop-style home page published")
  }
}
