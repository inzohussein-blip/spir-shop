import type { MedusaContainer } from "@medusajs/framework"
import type { AuthenticatedMedusaRequest, MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
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

/** First sales channel linked to a publishable key: where that key's carts, orders and products live. */
export async function keySalesChannelId(container: MedusaContainer, apiKeyId: string): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "api_key", fields: ["id", "sales_channels.id"], filters: { id: apiKeyId } })
  const channels = ((data[0] as unknown as { sales_channels?: ({ id: string } | null)[] } | undefined)?.sales_channels ?? []).filter(Boolean)
  return channels[0]?.id ?? null
}

export type PublishableKeyChoice = { id: string; token: string; sales_channel_id: string; products: number }

/**
 * The publishable key the default store's app should use: the active key whose
 * sales channel holds the most products. Medusa creates its own key on an empty
 * "Default Sales Channel"; the store's products live behind the seeded key.
 */
export async function bestPublishableKey(container: MedusaContainer): Promise<PublishableKeyChoice | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "revoked_at", "created_at", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  const choices: PublishableKeyChoice[] = []
  for (const k of keys as unknown as { id: string; token: string; revoked_at: unknown; created_at: string; sales_channels?: ({ id: string } | null)[] }[]) {
    const channel = (k.sales_channels ?? []).find(Boolean)
    if (k.revoked_at || !channel) continue
    const { data } = await query.graph({ entity: "sales_channel", fields: ["id", "products_link.product_id"], filters: { id: channel.id } })
    choices.push({ id: k.id, token: k.token, sales_channel_id: channel.id, products: ((data[0]?.products_link as unknown[]) ?? []).length })
  }
  // most products first; on a tie the oldest key (stable)
  choices.sort((a, b) => b.products - a.products)
  return choices[0] ?? null
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

/**
 * Platform admins manage every store; any other admin user only manages the
 * stores whose `owner_email` is their email. Platform admins are listed in
 * PLATFORM_ADMIN_EMAILS (comma separated), falling back to ADMIN_EMAIL. When
 * neither is set (local development, single store) every admin is a platform admin.
 */
const platformAdminEmails = (): string[] =>
  (process.env.PLATFORM_ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

async function adminEmail(req: MedusaRequest): Promise<string | null> {
  const actorId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id
  if (!actorId) return null
  const users = req.scope.resolve(Modules.USER)
  const user = await users.retrieveUser(actorId).catch(() => null)
  return user?.email?.toLowerCase() ?? null
}

export type AdminAccess = { platform: boolean; tenants: TenantRecord[] }

/** Which stores the logged-in admin user may manage. */
export async function adminAccess(req: MedusaRequest, fresh = false): Promise<AdminAccess> {
  const list = await listTenants(req.scope, fresh)
  const admins = platformAdminEmails()
  const email = await adminEmail(req)
  if (!admins.length || (email && admins.includes(email))) return { platform: true, tenants: list }
  return { platform: false, tenants: list.filter((t) => !!email && t.owner_email?.toLowerCase() === email) }
}

export async function requirePlatformAdmin(req: MedusaRequest): Promise<void> {
  if (!(await adminAccess(req)).platform) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "هذا الإجراء لمدير المنصة فقط")
  }
}

/**
 * Store selected in the admin (x-tenant-id header), else the user's default
 * store. Refuses a store the user doesn't manage.
 */
export async function tenantFromAdminRequest(req: MedusaRequest): Promise<TenantRecord> {
  const id = String(req.headers["x-tenant-id"] ?? "")
  const { tenants } = await adminAccess(req)
  if (!tenants.length) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "لا يوجد متجر مرتبط بحسابك")
  if (id) {
    const t = tenants.find((x) => x.id === id)
    if (!t) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "ليس لديك صلاحية على هذا المتجر")
    return t
  }
  return tenants.find((x) => x.is_default) ?? tenants[0]
}

export const tenantSettings = (t: TenantRecord): AppSettings => ({ ...DEFAULT_APP_SETTINGS, ...(t.settings ?? {}) })
export const tenantFeatures = (t: TenantRecord): Features => ({ ...DEFAULT_FEATURES, ...(t.features ?? {}) })
export const tenantBranding = (t: TenantRecord): Required<Pick<Branding, "app_name" | "theme">> & Branding => ({
  ...(t.branding ?? {}),
  app_name: t.branding?.app_name || t.name,
  theme: t.branding?.theme ?? tenantSettings(t).default_theme ?? "elegant",
})
