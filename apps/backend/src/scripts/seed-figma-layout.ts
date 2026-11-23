import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchLinkProductsToCategoryWorkflow,
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"
import type { AppBlock } from "../lib/app-blocks"
import { APP_CONTENT_MODULE } from "../modules/app_content"
import { publishAppLayoutWorkflow } from "../workflows/app-content"

/**
 * Demo content for the app's design (FluxStore layout):
 *  - "Discover" cards: a colour and a photo for each top category (category metadata)
 *  - sub-categories listed under each card, with the demo products linked to them
 *  - a home page published in the design's section order
 *
 * Run: npx medusa exec ./src/scripts/seed-figma-layout.ts   (safe to run again)
 * Change all of it later in the admin: Products > Categories, and "App builder".
 */

/** Top category → discover card colour, photo (product handle) and sub-categories with their products. */
const CATEGORIES: Record<string, { color: string; image: string; subs: Record<string, string[]> }> = {
  "العناية بالبشرة": {
    color: "#a3a798",
    image: "ordinary-niacinamide",
    subs: {
      "سيروم": ["vitamin-c-serum", "ordinary-niacinamide", "ordinary-hyaluronic"],
      "غسول ومنظفات": ["cerave-foaming-cleanser", "lrp-effaclar-gel", "loreal-micellar-water"],
      "مرطبات": ["cerave-moisturizing-cream"],
      "واقي شمس": ["sunscreen-spf50", "lrp-anthelios-spf50"],
    },
  },
  "المكياج": {
    color: "#8d8180",
    image: "nyx-eyeshadow-palette",
    subs: {
      "الشفاه": ["matte-lipstick", "liquid-lipstick-shades", "nyx-soft-matte-lip-cream"],
      "العيون": ["maybelline-lash-sensational", "nyx-eyeshadow-palette"],
      "الوجه": ["maybelline-fit-me"],
    },
  },
  "العناية بالشعر": {
    color: "#44535a",
    image: "argan-hair-oil",
    subs: { "شامبو": ["loreal-elvive-shampoo"], "زيوت الشعر": ["argan-hair-oil"] },
  },
  "العناية بالجسم": {
    color: "#b9adb0",
    image: "nivea-creme",
    subs: { "مرطبات الجسم": ["nivea-creme"], "مزيلات العرق": ["nivea-deodorant"] },
  },
  "العطور": { color: "#c8b49a", image: "nivea-deodorant", subs: {} },
}

export default async function seedFigmaLayout({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({ entity: "product", fields: ["id", "handle", "thumbnail"] })
  const byHandle = new Map(products.map((p) => [p.handle, p]))
  const thumb = (handle: string) => byHandle.get(handle)?.thumbnail ?? ""

  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "parent_category_id", "metadata"],
  })

  for (const [name, conf] of Object.entries(CATEGORIES)) {
    const parent = cats.find((c) => c.name === name && !c.parent_category_id)
    if (!parent) continue
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: parent.id },
        update: { metadata: { ...(parent.metadata ?? {}), color: conf.color, image_url: thumb(conf.image) } },
      },
    })
    for (const [sub, handles] of Object.entries(conf.subs)) {
      let child = cats.find((c) => c.name === sub && c.parent_category_id === parent.id)
      if (!child) {
        const { result } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [
              { name: sub, parent_category_id: parent.id, is_active: true, handle: `${parent.id.slice(-6)}-${sub}`.toLowerCase() },
            ],
          },
        })
        child = { ...result[0], metadata: null } as unknown as (typeof cats)[number]
      }
      const ids = handles.map((h) => byHandle.get(h)?.id).filter((x): x is string => !!x)
      if (ids.length) {
        await batchLinkProductsToCategoryWorkflow(container).run({ input: { id: child!.id, add: ids, remove: [] } })
      }
    }
  }
  logger.info("Discover cards and sub-categories ready")

  // Keep the merchant's banner slides if a layout was already published
  const svc = container.resolve(APP_CONTENT_MODULE) as {
    listAppLayouts: (f: object) => Promise<{ published: { blocks: AppBlock[] } | null }[]>
  }
  const [current] = await svc.listAppLayouts({ page: "home" })
  const oldCarousel = current?.published?.blocks.find((b) => b.type === "hero_carousel")
  const slides = (oldCarousel?.props.slides as unknown[] | undefined)?.length
    ? oldCarousel!.props.slides
    : [{ title: "خصم 25% على\nالعناية بالبشرة", image_url: thumb("vitamin-c-serum"), link: "/category/all?sale=1", background_color: "#8a3b4a", text_color: "#ffffff" }]

  const blocks: AppBlock[] = [
    { id: "categories", type: "category_chips", props: { title: "" } },
    { id: "hero", type: "hero_carousel", props: { slides, interval: 5 } },
    { id: "featured", type: "product_carousel", props: { title: "منتجات مميزة", source: "all", limit: 8, style: "featured" } },
    {
      id: "new-collection",
      type: "collection_banner",
      props: { variant: "wide", label: "تشكيلة جديدة", title: "مكياج\nالسهرات", image_url: thumb("nyx-soft-matte-lip-cream"), link: "/category/all?q=" + encodeURIComponent("نيكس") },
    },
    { id: "recommended", type: "product_carousel", props: { title: "مقترحة لكِ", source: "all", limit: 8, style: "compact" } },
    { id: "top-title", type: "heading", props: { text: "أفضل التشكيلات", size: 20, link: "/search" } },
    {
      id: "top-1",
      type: "collection_banner",
      props: { variant: "card", label: "خصومات لغاية 25%", title: "نضارة\nوترطيب", image_url: thumb("ordinary-niacinamide"), link: "/category/all?sale=1" },
    },
    {
      id: "top-2",
      type: "collection_banner",
      props: { variant: "bold", label: "تشكيلة الصيف 2026", title: "حماية كاملة\nمن الشمس\nلكل البشرات", image_url: thumb("lrp-anthelios-spf50"), link: "/category/all?q=" + encodeURIComponent("واقي") },
    },
    {
      id: "top-3",
      type: "collection_pair",
      props: {
        items: [
          { label: "العناية بالشعر", title: "شعر صحي\nولامع", image_url: thumb("argan-hair-oil"), link: "/category/all?q=" + encodeURIComponent("شعر") },
          { label: "العناية بالجسم", title: "نعومة\nتدوم", image_url: thumb("nivea-creme"), link: "/category/all?q=" + encodeURIComponent("نيفيا") },
        ],
      },
    },
  ]
  await publishAppLayoutWorkflow(container).run({ input: { page: "home", blocks } })
  logger.info("Home layout published in the design's order")
}
