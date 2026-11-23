import { COLORS } from "./config"

/** Customer-facing order status labels and colors. */
export const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  placed: { text: "بانتظار التأكيد", color: "#d98a1f" },
  confirmed: { text: "مؤكد", color: "#3b7dd8" },
  shipped: { text: "مع المندوب", color: COLORS.accent },
  delivered: { text: "تم التسليم", color: COLORS.accent },
  canceled: { text: "ملغي", color: COLORS.danger },
}
