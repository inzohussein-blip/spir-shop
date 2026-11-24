import type { MedusaContainer } from "@medusajs/framework"
import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../modules/app_content"
import type AppContentModuleService from "../modules/app_content/service"
import { AppSettings, DEFAULT_APP_SETTINGS } from "./app-settings"

/**
 * Multi-store helpers. Every request belongs to one store (tenant):
 *  - store API: found from the publishable key the app sends
 *  - admin API: chosen in the admin with the "x-tenant-id" header (store switcher)
 * Requests without either use the default store.
 */

export type Branding = { app_name?: string; logo_url?: string; theme?: "elegant" | "natural"; accent_color?: string }

/** App features each store can switch on or off. */
export const FEATURE_KEYS = ["wishlist", "reviews", "stories", "coupons", "brands", "notifications", "flash_sale"] as const
export type FeatureKey = (typeof FEATURE_KEYS)[number]
export type Features = Record<FeatureKey, boolean>
export const DEFAULT_FEATURES: Features = {
  wishlist: true,
  reviews: true,
  stories: true,
  coupons: true,
  brands: true,
  notifications: true,
  flash_sale: true,
}

export type TenantRecord = {
  id: string
  slug: string
  name: string
  status: "active" | "suspended"
  is_default: boolean
  sales_channel_id: string
  api_key_id: string
  api_key_token: string
  branding: Branding | null
  features: Partial<Features> | null
  settings: Partial<AppSettings> | null
  owner_email: string | null
}

const svc = (c: MedusaContainer) => c.resolve<AppContentModuleService>(APP_CONTENT_MODULE)

// Small in-memory cache so the lookup doesn't hit the database on every request
const TTL = 30_000
let cache: { at: number; list: TenantRecord[] } | null = null

export async function listTenants(container: MedusaContainer, fresh = false): Promise<TenantRecord[]> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.list
  const list = (await svc(container).listTenants({}, { order: { created_at: "ASC" }, take: 1000 })) as unknown as TenantRecord[]
  cache = { at: Date.now(), list }
  return list
}

export const clearTenantCache = () => {
  cache = null
}

export async function defaultTenant(container: MedusaContainer): Promise<TenantRecord> {
  const list = await listTenants(container)
  const t = list.find((x) => x.is_default) ?? list[0]
  if (!t) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No store has been set up yet")
  return t
}

/** Store of a /store request (from its publishable key). */
export async function tenantFromStoreRequest(req: MedusaRequest): Promise<TenantRecord> {
  const key = String(req.headers["x-publishable-api-key"] ?? "")
  const list = await listTenants(req.scope)
  const t = (key && list.find((x) => x.api_key_token === key)) || (await defaultTenant(req.scope))
  if (t.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "هذا المتجر متوقف حالياً")
  return t
}

/** Store selected in the admin (x-tenant-id header), else the default one. */
export async function tenantFromAdminRequest(req: MedusaRequest): Promise<TenantRecord> {
  const id = String(req.headers["x-tenant-id"] ?? "")
  const list = await listTenants(req.scope)
  return (id && list.find((x) => x.id === id)) || (await defaultTenant(req.scope))
}

export const tenantSettings = (t: TenantRecord): AppSettings => ({ ...DEFAULT_APP_SETTINGS, ...(t.settings ?? {}) })
export const tenantFeatures = (t: TenantRecord): Features => ({ ...DEFAULT_FEATURES, ...(t.features ?? {}) })
export const tenantBranding = (t: TenantRecord): Required<Pick<Branding, "app_name" | "theme">> & Branding => ({
  ...(t.branding ?? {}),
  app_name: t.branding?.app_name || t.name,
  theme: t.branding?.theme ?? tenantSettings(t).default_theme ?? "elegant",
})
