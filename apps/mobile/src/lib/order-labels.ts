import { COLORS } from "./config"

/** Customer-facing order status labels and colors. */
export const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  placed: { text: "بانتظار التأكيد", color: "#d98a1f" },
  confirmed: { text: "مؤكد", color: "#3b7dd8" },
  shipped: { text: "مع المندوب", color: COLORS.accent },
  delivered: { text: "تم التسليم", color: COLORS.accent },
  canceled: { text: "ملغي", color: COLORS.danger },
}

/** Short code shown as "tracking number" (last part of the order id). */
export const trackingCode = (orderId: string) => `SP${orderId.slice(-8).toUpperCase()}`

/** dd/mm/yyyy */
export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB")

/** "15 May 10:20" style, Arabic month */
export const stepTime = (iso: string) =>
  new Date(iso).toLocaleString("ar-IQ-u-nu-latn", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
