import { model } from "@medusajs/framework/utils"

/**
 * Server-driven UI layout for one app page (e.g. "home").
 * `draft` is what the admin builder edits; `published` is what the app renders.
 */
const AppLayout = model.define("app_layout", {
  id: model.id({ prefix: "alay" }).primaryKey(),
  page: model.text().unique(),
  draft: model.json(),
  published: model.json().nullable(),
  version: model.number().default(0),
  published_at: model.dateTime().nullable(),
})

export default AppLayout
