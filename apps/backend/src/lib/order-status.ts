/**
 * Customer-facing order timeline, derived from Medusa's order data:
 *   placed     - order created
 *   confirmed  - confirmed by phone in the admin (order.metadata.confirmed_at)
 *   shipped    - a fulfillment was shipped (with the courier)
 *   delivered  - a fulfillment was marked as delivered
 *   canceled   - order canceled
 */
export type OrderStep = { key: "placed" | "confirmed" | "shipped" | "delivered"; label: string; at: string | null }

type OrderLike = {
  created_at: Date | string
  status: string
  canceled_at?: Date | string | null
  metadata?: Record<string, unknown> | null
  fulfillments?: ({ shipped_at?: Date | string | null; delivered_at?: Date | string | null } | null)[] | null
}

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null)

export function orderTimeline(order: OrderLike) {
  const fulfillments = (order.fulfillments ?? []).filter(Boolean) as {
    shipped_at?: Date | string | null
    delivered_at?: Date | string | null
  }[]
  const shippedAt = fulfillments.map((f) => f.shipped_at).find(Boolean)
  const deliveredAt = fulfillments.map((f) => f.delivered_at).find(Boolean)
  const confirmedAt = order.metadata?.confirmed_at as string | undefined

  const steps: OrderStep[] = [
    { key: "placed", label: "تم استلام الطلب", at: iso(order.created_at) },
    { key: "confirmed", label: "تم التأكيد بالهاتف", at: iso(confirmedAt) },
    { key: "shipped", label: "مع المندوب", at: iso(shippedAt) },
    { key: "delivered", label: "تم التسليم", at: iso(deliveredAt) },
  ]
  const canceled = order.status === "canceled"
  const current = canceled
    ? "canceled"
    : deliveredAt
      ? "delivered"
      : shippedAt
        ? "shipped"
        : confirmedAt
          ? "confirmed"
          : "placed"
  return { steps, current, canceled_at: iso(order.canceled_at) }
}

export const STATUS_PUSH: Record<string, { title: string; body: string }> = {
  confirmed: { title: "تم تأكيد طلبك", body: "طلبك رقم #{n} تأكد وراح نجهزه للتوصيل." },
  shipped: { title: "طلبك بالطريق", body: "طلبك رقم #{n} صار مع المندوب. جهّزي المبلغ عند الاستلام." },
  delivered: { title: "تم تسليم طلبك", body: "نتمنى يعجبك طلبك رقم #{n}! قيّمي المنتجات وساعدي غيرك." },
}
