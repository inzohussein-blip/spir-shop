import { readFileSync } from "fs"
import { join } from "path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Demo catalog for the trial version: brands (product collections) with a few
 * products each. Prices and descriptions are DEMO data; replace them with the
 * distributor's real prices, descriptions and product photos before launch.
 * Images are neutral illustrations generated for the demo (no logos).
 *
 * Run: npx medusa exec ./src/scripts/seed-demo-brands.ts   (safe to run twice)
 */

type DemoProduct = {
  title: string
  handle: string
  description: string
  category: string
  image: string
  price: number
  /** shade name -> color, for products sold in several shades */
  shades?: Record<string, string>
}

type DemoBrand = { title: string; handle: string; origin: string; products: DemoProduct[] }

const BRANDS: DemoBrand[] = [
  {
    title: "CeraVe",
    handle: "cerave",
    origin: "الولايات المتحدة",
    products: [
      { title: "سيرافي كريم مرطب للبشرة الجافة 454 غم", handle: "cerave-moisturizing-cream", description: "كريم مرطب غني بالسيراميدات وحمض الهيالورونيك للوجه والجسم، مناسب للبشرة الجافة إلى الجافة جداً.", category: "العناية بالبشرة", image: "moisturizer-jar.jpg", price: 28000 },
      { title: "سيرافي غسول رغوي للبشرة العادية إلى الدهنية 236 مل", handle: "cerave-foaming-cleanser", description: "غسول رغوي ينظف البشرة ويزيل الزيوت الزائدة بدون أن يخل بحاجز البشرة.", category: "العناية بالبشرة", image: "cleanser-pump.jpg", price: 22000 },
    ],
  },
  {
    title: "The Ordinary",
    handle: "the-ordinary",
    origin: "كندا",
    products: [
      { title: "ذي أورديناري سيروم نياسيناميد 10% + زنك 1% 30 مل", handle: "ordinary-niacinamide", description: "سيروم خفيف يساعد على تقليل مظهر المسام وتوحيد لون البشرة.", category: "العناية بالبشرة", image: "serum-dropper.jpg", price: 15000 },
      { title: "ذي أورديناري حمض الهيالورونيك 2% + B5 30 مل", handle: "ordinary-hyaluronic", description: "سيروم ترطيب مكثف لجميع أنواع البشرة.", category: "العناية بالبشرة", image: "hyaluronic-dropper.jpg", price: 16000 },
    ],
  },
  {
    title: "La Roche-Posay",
    handle: "la-roche-posay",
    origin: "فرنسا",
    products: [
      { title: "لاروش بوزيه واقي شمس أنثيليوس SPF50+ 50 مل", handle: "lrp-anthelios-spf50", description: "واقي شمس بحماية عالية وقوام خفيف، مناسب للبشرة الحساسة.", category: "العناية بالبشرة", image: "sunscreen-tube.jpg", price: 32000 },
      { title: "لاروش بوزيه إيفاكلار جل منظف 200 مل", handle: "lrp-effaclar-gel", description: "جل منظف للبشرة الدهنية والمعرضة لحب الشباب.", category: "العناية بالبشرة", image: "gel-cleanser.jpg", price: 27000 },
    ],
  },
  {
    title: "Maybelline",
    handle: "maybelline",
    origin: "الولايات المتحدة",
    products: [
      { title: "ميبيلين ماسكارا لاش سنسيشنال", handle: "maybelline-lash-sensational", description: "ماسكارا لرموش أكثف وأطول بمظهر طبيعي.", category: "المكياج", image: "mascara.jpg", price: 13000 },
      {
        title: "ميبيلين كريم أساس فِت مي 30 مل",
        handle: "maybelline-fit-me",
        description: "كريم أساس بلمسة طبيعية يناسب لون البشرة، متوفر بعدة درجات.",
        category: "المكياج",
        image: "foundation.jpg",
        price: 17000,
        shades: { "110 Porcelain": "#f3d9c4", "120 Classic Ivory": "#ecd0b4", "220 Natural Beige": "#d9b08c", "330 Toffee": "#a9714b" },
      },
    ],
  },
  {
    title: "L'Oréal Paris",
    handle: "loreal-paris",
    origin: "فرنسا",
    products: [
      { title: "لوريال باريس شامبو إلفيف للشعر التالف 400 مل", handle: "loreal-elvive-shampoo", description: "شامبو يغذي الشعر التالف ويمنحه نعومة ولمعاناً.", category: "العناية بالشعر", image: "shampoo.jpg", price: 9000 },
      { title: "لوريال باريس ماء ميسيلار 400 مل", handle: "loreal-micellar-water", description: "ماء ميسيلار ينظف البشرة ويزيل المكياج بلطف.", category: "العناية بالبشرة", image: "micellar.jpg", price: 12000 },
    ],
  },
  {
    title: "NYX",
    handle: "nyx",
    origin: "الولايات المتحدة",
    products: [
      {
        title: "نيكس أحمر شفاه سائل سوفت مات",
        handle: "nyx-soft-matte-lip-cream",
        description: "أحمر شفاه سائل بلمسة مات ناعمة وثبات طويل.",
        category: "المكياج",
        image: "lip-cream.jpg",
        price: 10000,
        shades: { Stockholm: "#b27a6e", Cannes: "#a2524f", "Monte Carlo": "#8e2a3d", Copenhagen: "#7a3b48" },
      },
      { title: "نيكس باليت ظلال عيون", handle: "nyx-eyeshadow-palette", description: "باليت ظلال بألوان ترابية سهلة الدمج للمكياج اليومي والسهرات.", category: "المكياج", image: "eyeshadow-palette.jpg", price: 18000 },
    ],
  },
  {
    title: "NIVEA",
    handle: "nivea",
    origin: "ألمانيا",
    products: [
      { title: "نيفيا كريم مرطب 150 مل", handle: "nivea-creme", description: "كريم مرطب كلاسيكي للوجه واليدين والجسم.", category: "العناية بالجسم", image: "body-creme.jpg", price: 6000 },
      { title: "نيفيا مزيل عرق بخاخ 150 مل", handle: "nivea-deodorant", description: "حماية من التعرق تدوم 48 ساعة.", category: "العناية بالجسم", image: "deodorant.jpg", price: 5000 },
    ],
  },
]

export default async function seedDemoBrands({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({ entity: "product_collection", fields: ["handle"] })
  const have = new Set(existing.map((c) => c.handle))
  const todo = BRANDS.filter((b) => !have.has(b.handle))
  if (!todo.length) {
    logger.info("Demo brands already exist, nothing to do")
    return
  }

  const [{ data: channels }, { data: profiles }, { data: locations }, { data: categories }] = await Promise.all([
    query.graph({ entity: "sales_channel", fields: ["id"] }),
    query.graph({ entity: "shipping_profile", fields: ["id"] }),
    query.graph({ entity: "stock_location", fields: ["id"] }),
    query.graph({ entity: "product_category", fields: ["id", "name"] }),
  ])
  const categoryId = (name: string) => categories.find((c) => c.name === name)?.id

  // Upload the demo images once
  const imageNames = Array.from(new Set(todo.flatMap((b) => b.products.map((p) => p.image))))
  const { result: files } = await uploadFilesWorkflow(container).run({
    input: {
      files: imageNames.map((name) => ({
        filename: name,
        mimeType: "image/jpeg",
        content: readFileSync(join(__dirname, "demo-assets", name)).toString("base64"),
        access: "public" as const,
      })),
    },
  })
  const imageUrl = (name: string) => files[imageNames.indexOf(name)].url

  const { result: collections } = await createCollectionsWorkflow(container).run({
    input: {
      collections: todo.map((b) => ({ title: b.title, handle: b.handle, metadata: { origin: b.origin, is_brand: true } })),
    },
  })

  for (const brand of todo) {
    const collection = collections.find((c) => c.handle === brand.handle)!
    await createProductsWorkflow(container).run({
      input: {
        products: brand.products.map((p) => {
          const values = p.shades ? Object.keys(p.shades) : ["قياسي"]
          const optionTitle = p.shades ? "الدرجة" : "الحجم"
          return {
            title: p.title,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            collection_id: collection.id,
            category_ids: categoryId(p.category) ? [categoryId(p.category)!] : [],
            shipping_profile_id: profiles[0].id,
            thumbnail: imageUrl(p.image),
            images: [{ url: imageUrl(p.image) }],
            options: [{ title: optionTitle, values }],
            metadata: p.shades ? { swatches: p.shades, demo: true } : { demo: true },
            variants: values.map((v) => ({
              title: v,
              sku: `${p.handle}-${v}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 60),
              options: { [optionTitle]: v },
              prices: [{ currency_code: "iqd", amount: p.price }],
            })),
            sales_channels: [{ id: channels[0].id }],
          }
        }),
      },
    })
  }

  // Stock for the new products
  const handles = todo.flatMap((b) => b.products.map((p) => p.handle))
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["variants.inventory_items.inventory_item_id"],
    filters: { handle: handles },
  })
  const itemIds = products.flatMap((p) =>
    (p.variants ?? []).flatMap((v) => (v?.inventory_items ?? []).map((i) => i?.inventory_item_id))
  ).filter((id): id is string => !!id)
  if (itemIds.length && locations[0]) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: itemIds.map((id) => ({ inventory_item_id: id, location_id: locations[0].id, stocked_quantity: 50 })),
      },
    })
  }

  logger.info(`Demo brands created: ${todo.map((b) => b.title).join(", ")} (${handles.length} products)`)
}
