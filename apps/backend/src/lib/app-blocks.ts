import { z } from "@medusajs/framework/zod"

/**
 * Server-driven UI contract shared by the admin builder and the mobile app.
 *
 * A layout is an ordered list of blocks. Each block has a stable `id`, a `type`
 * the app knows how to render, and `props`. Apps skip block types they don't
 * know, so new block types can be added without breaking older app versions.
 */
export const APP_BLOCK_TYPES = [
  "hero_banner",
  "hero_carousel",
  "trust_strip",
  "flash_sale",
  "story_bar",
  "category_chips",
  "brand_strip",
  "product_carousel",
  "product_grid",
  "countdown_offer",
  "video_banner",
  "collection_banner",
  "collection_pair",
  "heading",
  "spacer",
] as const

export type AppBlockType = (typeof APP_BLOCK_TYPES)[number]

export const AppBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  props: z.record(z.string(), z.unknown()).default({}),
})

export const AppLayoutBlocksSchema = z.array(AppBlockSchema).max(100)

export type AppBlock = z.infer<typeof AppBlockSchema>

/** Layout used until the merchant publishes their first design (section order of the design's home page). */
export const DEFAULT_HOME_BLOCKS: AppBlock[] = [
  { id: "categories", type: "category_chips", props: { title: "" } },
  {
    id: "hero",
    type: "hero_carousel",
    props: {
      slides: [{ title: "تشكيلة العناية الجديدة", subtitle: "", image_url: "", link: "/category/all", background_color: "#c9b8a8", text_color: "#ffffff" }],
      interval: 5,
    },
  },
  { id: "featured", type: "product_carousel", props: { title: "منتجات مميزة", source: "all", limit: 8 } },
  {
    id: "new-collection",
    type: "collection_banner",
    props: { variant: "wide", label: "تشكيلة جديدة", title: "جمالك\nبكل مناسبة", image_url: "", link: "/category/all" },
  },
  { id: "recommended", type: "product_carousel", props: { title: "مقترحة لكِ", source: "all", limit: 8, style: "compact" } },
  { id: "top-title", type: "heading", props: { text: "أفضل التشكيلات", size: 20, link: "/search" } },
  {
    id: "top-1",
    type: "collection_banner",
    props: { variant: "card", label: "خصومات لغاية 40%", title: "للبشرة\nالنضرة", image_url: "", link: "/category/all?sale=1" },
  },
]

export const defaultBlocksFor = (page: string): AppBlock[] =>
  page === "home" ? DEFAULT_HOME_BLOCKS : []
