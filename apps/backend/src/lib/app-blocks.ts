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
  "story_bar",
  "category_chips",
  "product_carousel",
  "product_grid",
  "countdown_offer",
  "video_banner",
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

/** Layout used until the merchant publishes their first design. */
export const DEFAULT_HOME_BLOCKS: AppBlock[] = [
  { id: "stories", type: "story_bar", props: {} },
  {
    id: "hero",
    type: "hero_banner",
    props: {
      title: "جمالك يبدأ من العناية",
      subtitle: "توصيل لكل المحافظات - الدفع عند الاستلام",
      cta_label: "تسوقي الآن",
      link: "/category/all",
      background_color: "#fbeeec",
      text_color: "#5c2733",
      image_url: "",
    },
  },
  { id: "categories", type: "category_chips", props: { title: "الأقسام" } },
  {
    id: "best",
    type: "product_carousel",
    props: { title: "الأكثر طلباً", source: "all", limit: 8 },
  },
  {
    id: "all",
    type: "product_grid",
    props: { title: "كل المنتجات", source: "all", limit: 20 },
  },
]

export const defaultBlocksFor = (page: string): AppBlock[] =>
  page === "home" ? DEFAULT_HOME_BLOCKS : []
