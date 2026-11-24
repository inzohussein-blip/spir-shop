import { model } from "@medusajs/framework/utils"

/** Expo push token of an app install, with targeting info. */
const PushToken = model.define("app_push_token", {
  id: model.id({ prefix: "ptok" }).primaryKey(),
  /** store (app_tenant) this belongs to */
  tenant_id: model.text().index().nullable(),
  token: model.text().unique(),
  platform: model.text(),
  cart_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  province: model.text().nullable(),
  /** Orders placed from this device, for order status notifications */
  order_ids: model.json().nullable(),
  enabled: model.boolean().default(true),
  last_seen_at: model.dateTime().nullable(),
})

export default PushToken
