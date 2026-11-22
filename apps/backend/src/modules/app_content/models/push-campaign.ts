import { model } from "@medusajs/framework/utils"

/** A push notification sent from the admin (or automatically, e.g. abandoned cart). */
const PushCampaign = model.define("app_push_campaign", {
  id: model.id({ prefix: "pcamp" }).primaryKey(),
  kind: model.enum(["campaign", "abandoned_cart"]).default("campaign"),
  title: model.text(),
  body: model.text(),
  link: model.text().nullable(),
  audience: model.json().nullable(),
  status: model.enum(["sending", "sent", "failed"]).default("sending"),
  sent_count: model.number().default(0),
  failed_count: model.number().default(0),
  sent_at: model.dateTime().nullable(),
})

export default PushCampaign
