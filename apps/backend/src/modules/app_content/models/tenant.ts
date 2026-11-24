import { model } from "@medusajs/framework/utils"

/**
 * A store on the shared server (multi-tenant). Each store has its own sales
 * channel and publishable API key, so its products, carts and orders are kept
 * apart by Medusa; the app content below (home layout, stories, notifications,
 * reviews, settings) is kept apart with `tenant_id`.
 */
const Tenant = model.define("app_tenant", {
  id: model.id({ prefix: "tnt" }).primaryKey(),
  /** short name used in app builds and links, e.g. "glow" */
  slug: model.text().unique(),
  name: model.text(),
  status: model.enum(["active", "suspended"]).default("active"),
  /** the store used by older app versions and when no key is sent */
  is_default: model.boolean().default(false),
  sales_channel_id: model.text(),
  api_key_id: model.text(),
  /** publishable key token: the app sends it with every request */
  api_key_token: model.text().index(),
  /** app_name, logo_url, theme ("elegant" | "natural") */
  branding: model.json().nullable(),
  /** on/off switches for app features (wishlist, reviews, stories, coupons...) */
  features: model.json().nullable(),
  /** delivery, contact and trust badges settings (see lib/app-settings) */
  settings: model.json().nullable(),
  owner_email: model.text().nullable(),
})

export default Tenant
