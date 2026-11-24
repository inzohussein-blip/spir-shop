/**
 * Store-wide app settings, kept in the store's metadata (key "app_settings")
 * and edited from the admin page "App settings".
 */
export type AppSettings = {
  /** Free delivery when the cart's items total reaches this amount (IQD). 0 = off */
  free_shipping_threshold: number
  /** Contact links shown in the app (account page, order page) */
  whatsapp_number: string
  telegram_username: string
  support_phone: string
  /** Delivery estimate shown on the product page */
  baghdad_eta: string
  provinces_eta: string
  /** Trust badges shown on the home screen and product page */
  trust_badges: string[]
  /** Look of the app until the customer picks one in Settings: "elegant" or "natural" */
  default_theme: "elegant" | "natural"
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  free_shipping_threshold: 50000,
  whatsapp_number: "",
  telegram_username: "",
  support_phone: "",
  baghdad_eta: "خلال 24 ساعة",
  provinces_eta: "خلال 2-3 أيام",
  trust_badges: ["أصلي 100%", "توصيل لكل المحافظات", "الدفع عند الاستلام"],
  default_theme: "elegant",
}

export function readAppSettings(metadata: Record<string, unknown> | null | undefined): AppSettings {
  const saved = (metadata?.app_settings ?? {}) as Partial<AppSettings>
  return { ...DEFAULT_APP_SETTINGS, ...saved }
}
