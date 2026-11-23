import AsyncStorage from "@react-native-async-storage/async-storage"
import { getBackendUrl, PUBLISHABLE_KEY } from "./config"

/**
 * Publishable key: baked in at build time when EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY
 * is set, otherwise discovered from the server (GET /mobile/config) and cached
 * per server address. This lets one APK (built by CI) work with any server.
 */
let discoveredKey: { base: string; key: string } | null = null
async function publishableKey(base: string): Promise<string> {
  if (PUBLISHABLE_KEY) return PUBLISHABLE_KEY
  if (discoveredKey?.base === base) return discoveredKey.key
  const cacheKey = `spir_pk_${base}`
  try {
    const res = await fetch(`${base}/mobile/config`)
    const json = (await res.json()) as { publishable_key?: string | null }
    if (json.publishable_key) {
      discoveredKey = { base, key: json.publishable_key }
      AsyncStorage.setItem(cacheKey, json.publishable_key).catch(() => undefined)
      return json.publishable_key
    }
  } catch {
    // offline: fall back to the last known key for this server
  }
  const cached = await AsyncStorage.getItem(cacheKey).catch(() => null)
  if (cached) {
    discoveredKey = { base, key: cached }
    return cached
  }
  return ""
}

/** Origins the backend may use in file URLs when it is not configured with its public address. */
const LOCAL_ORIGINS = ["http://localhost:9000", "http://127.0.0.1:9000"]

/** Minimal Medusa Store API client (fetch-based, works on iOS/Android/web). */
export async function storeFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const base = getBackendUrl()
  const res = await fetch(`${base}/store${path}`, {
    method: init.method ?? "GET",
    headers: {
      "content-type": "application/json",
      "x-publishable-api-key": await publishableKey(base),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  // Image/video URLs stored as localhost are rewritten to the server the app talks to
  let text = await res.text()
  if (!LOCAL_ORIGINS.includes(base)) {
    for (const origin of LOCAL_ORIGINS) text = text.split(origin).join(base)
  }
  let json: unknown = {}
  try {
    json = JSON.parse(text)
  } catch {
    // non-JSON error body
  }
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `HTTP ${res.status}`)
  }
  return json as T
}

export type Price = { calculated_amount: number; original_amount: number; currency_code: string }
export type Variant = {
  id: string
  title: string
  options?: { value: string; option?: { title: string } }[]
  calculated_price?: Price
  inventory_quantity?: number | null
  manage_inventory?: boolean
  allow_backorder?: boolean
}
export type Product = {
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  images?: { url: string }[]
  variants: Variant[]
  categories?: { id: string; name: string }[]
  /** The product's brand (a product collection) */
  collection?: { id: string; title: string } | null
  /** metadata.swatches maps an option value to a color, e.g. { "Rose Nude": "#c48a7f" } */
  metadata?: { swatches?: Record<string, string> } | null
}
export type Category = {
  id: string
  name: string
  handle: string
  parent_category_id: string | null
  /** color + image_url drive the "Discover" cards (set in the admin, category metadata) */
  metadata?: { color?: string; image_url?: string } | null
}
export type LineItem = {
  id: string
  title: string
  variant_id?: string
  product_id?: string
  product_title?: string | null
  variant?: { inventory_quantity?: number | null; manage_inventory?: boolean } | null
  subtitle?: string | null
  variant_title?: string | null
  thumbnail: string | null
  quantity: number
  unit_price: number
  total: number
}
export type Cart = {
  id: string
  items: LineItem[]
  subtotal: number
  item_subtotal?: number
  item_total?: number
  discount_total?: number
  shipping_total: number
  total: number
  promotions?: { code?: string | null }[]
  region_id: string
  shipping_methods?: { shipping_option_id: string }[]
}
export type ShippingOption = { id: string; name: string; amount: number; type?: { description?: string } }
export type Order = { id: string; display_id: number; total: number }

let regionId: string | null = null
export async function getRegionId(): Promise<string> {
  if (regionId) return regionId
  const { regions } = await storeFetch<{ regions: { id: string; currency_code: string }[] }>("/regions")
  regionId = (regions.find((r) => r.currency_code === "iqd") ?? regions[0]).id
  return regionId
}

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*categories,*images,+metadata,*collection"

export async function listProducts(
  params: { categoryId?: string; collectionId?: string; q?: string; limit?: number; ids?: string[] } = {}
) {
  const region = await getRegionId()
  const qs = new URLSearchParams({
    region_id: region,
    fields: PRODUCT_FIELDS,
    limit: String(params.limit ?? 50),
  })
  if (params.categoryId) qs.append("category_id[]", params.categoryId)
  if (params.collectionId) qs.append("collection_id[]", params.collectionId)
  for (const id of params.ids ?? []) qs.append("id[]", id)
  if (params.q) qs.set("q", params.q)
  return (await storeFetch<{ products: Product[] }>(`/products?${qs}`)).products
}

export async function getProduct(handle: string) {
  const region = await getRegionId()
  const qs = new URLSearchParams({ region_id: region, fields: PRODUCT_FIELDS, handle })
  return (await storeFetch<{ products: Product[] }>(`/products?${qs}`)).products[0] ?? null
}

/** Every category (top level and sub-categories) with its metadata. */
export async function listAllCategories() {
  const { product_categories } = await storeFetch<{ product_categories: Category[] }>(
    "/product-categories?fields=id,name,handle,parent_category_id,metadata&limit=100"
  )
  return product_categories
}

/** Number of products in a category (for the "N items" labels). */
export async function countProducts(params: { categoryId?: string; collectionId?: string }) {
  const qs = new URLSearchParams({ limit: "1", fields: "id" })
  if (params.categoryId) qs.append("category_id[]", params.categoryId)
  if (params.collectionId) qs.append("collection_id[]", params.collectionId)
  return (await storeFetch<{ count: number }>(`/products?${qs}`)).count
}

export async function listCategories() {
  const { product_categories } = await storeFetch<{ product_categories: Category[] }>(
    "/product-categories?fields=id,name,handle,parent_category_id&limit=50"
  )
  return product_categories.filter((c) => !c.parent_category_id)
}

export type VersionInfo = {
  latest_version: string
  min_version: string
  android_url: string
  ios_url: string
  message: string
}
export const getVersionInfo = () => storeFetch<VersionInfo>("/mobile-version")

/* ----------------------- server-driven UI & content ---------------------- */

export type Block = { id: string; type: string; props: Record<string, unknown> }
export type Layout = { page: string; version: number; blocks: Block[] }
export const getLayout = (page: string) => storeFetch<Layout>(`/app-layouts/${page}`)

export type Story = {
  id: string
  title: string
  media_url: string
  media_type: "image" | "video"
  thumbnail_url: string | null
  link: string | null
  cta_label: string | null
}
export const listStories = async () => (await storeFetch<{ stories: Story[] }>("/app-stories")).stories

export const registerPushToken = (body: {
  token: string
  platform: string
  cart_id?: string | null
  province?: string | null
  order_id?: string | null
}) => storeFetch("/push-tokens", { method: "POST", body })

/* --------------------------------- brands -------------------------------- */

/** Brands are product collections (manage them in the admin under Products > Collections). */
export type Brand = { id: string; title: string; handle: string; metadata?: { origin?: string } | null }
export const listBrands = async () =>
  (await storeFetch<{ collections: Brand[] }>("/collections?fields=id,title,handle,metadata&limit=50")).collections

/* ------------------------- settings, deals, reviews ------------------------ */

export type AppSettings = {
  free_shipping_threshold: number
  whatsapp_number: string
  telegram_username: string
  support_phone: string
  baghdad_eta: string
  provinces_eta: string
  trust_badges: string[]
}
export const getAppSettings = async () => (await storeFetch<{ settings: AppSettings }>("/app-settings")).settings

export type Sale = { title: string; ends_at: string | null; product_ids: string[] }
export const getSale = async () => (await storeFetch<{ sale: Sale | null }>("/app-sale")).sale

export type Rating = { average: number; count: number }
export const getRatings = async (productIds: string[]) =>
  (await storeFetch<{ ratings: Record<string, Rating> }>(`/app-reviews/summary?product_ids=${productIds.join(",")}`))
    .ratings

export type Review = { id: string; rating: number; name: string; comment: string | null; created_at: string; images?: string[] | null }
export type ReviewSummary = { average: number; count: number; distribution: { star: number; count: number }[] }
export const getReviews = (productId: string) =>
  storeFetch<{ summary: ReviewSummary; reviews: Review[] }>(`/app-reviews?product_id=${productId}`)
export const createReview = (body: { product_id: string; order_id: string; rating: number; name: string; comment?: string; images?: string[] }) =>
  storeFetch("/app-reviews", { method: "POST", body })

/** Upload review photos (base64). Allowed only with the id of an order placed from this device. */
export const uploadImages = async (orderId: string, files: { filename: string; mime_type: string; content: string }[]) =>
  (await storeFetch<{ urls: string[] }>("/app-uploads", { method: "POST", body: { order_id: orderId, files } })).urls

/** "Rate this app" feedback (sent to the staff Telegram chat). */
export const sendFeedback = (body: { rating: number; comment?: string; name?: string; phone?: string }) =>
  storeFetch("/app-feedback", { method: "POST", body })

/* --------------------------------- orders --------------------------------- */

export type OrderStepKey = "placed" | "confirmed" | "shipped" | "delivered"
export type AppOrder = {
  id: string
  display_id: number
  status: string
  created_at: string
  total: number
  item_total: number
  shipping_total: number
  current: OrderStepKey | "canceled"
  canceled_at: string | null
  steps: { key: OrderStepKey; label: string; at: string | null }[]
  items: {
    id: string
    title: string
    product_title?: string | null
    variant_title: string | null
    thumbnail: string | null
    quantity: number
    product_id: string
    variant_id?: string | null
    product_handle?: string | null
    unit_price: number
  }[]
  shipping_address?: { province?: string | null; city?: string | null; address_1?: string | null } | null
  shipping_methods?: { name: string }[]
}
export const getOrders = async (ids: string[]) =>
  ids.length ? (await storeFetch<{ orders: AppOrder[] }>(`/app-orders?ids=${ids.join(",")}`)).orders : []

export type AppNotification = { id: string; title: string; body: string; link: string | null; sent_at: string }
export const getNotifications = async (province?: string | null) =>
  (await storeFetch<{ notifications: AppNotification[] }>(
    `/app-notifications?province=${encodeURIComponent(province ?? "")}`
  )).notifications
