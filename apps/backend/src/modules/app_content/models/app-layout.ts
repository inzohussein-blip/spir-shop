import { model } from "@medusajs/framework/utils"

/**
 * Server-driven UI layout for one app page (e.g. "home").
 * `draft` is what the admin builder edits; `published` is what the app renders.
 */
const AppLayout = model.define("app_layout", {
  id: model.id({ prefix: "alay" }).primaryKey(),
  /** store (app_tenant) this layout belongs to */
  tenant_id: model.text().nullable(),
  page: model.text(),
  draft: model.json(),
  published: model.json().nullable(),
  version: model.number().default(0),
  published_at: model.dateTime().nullable(),
}).indexes([{ on: ["tenant_id", "page"], unique: true }])

export default AppLayout
