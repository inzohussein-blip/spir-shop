import { model } from "@medusajs/framework/utils"

/** Instagram-style story shown in the app's story bar. */
const Story = model.define("app_story", {
  id: model.id({ prefix: "story" }).primaryKey(),
  /** store (app_tenant) this belongs to */
  tenant_id: model.text().index().nullable(),
  title: model.text(),
  media_url: model.text(),
  media_type: model.enum(["image", "video"]).default("image"),
  thumbnail_url: model.text().nullable(),
  link: model.text().nullable(),
  cta_label: model.text().nullable(),
  rank: model.number().default(0),
  is_active: model.boolean().default(true),
  starts_at: model.dateTime().nullable(),
  expires_at: model.dateTime().nullable(),
})

export default Story
