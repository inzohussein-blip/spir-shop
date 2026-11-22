import { model } from "@medusajs/framework/utils"

/** Snapshot of every published layout, used for history and rollback. */
const AppLayoutVersion = model
  .define("app_layout_version", {
    id: model.id({ prefix: "alver" }).primaryKey(),
    page: model.text(),
    version: model.number(),
    blocks: model.json(),
  })
  .indexes([{ on: ["page", "version"], unique: true }])

export default AppLayoutVersion
