import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listStoreOrders } from "../../../lib/admin-orders"

const STATUSES = ["placed", "confirmed", "shipped", "delivered", "canceled"] as const

/**
 * GET /admin/app-orders?status=placed|confirmed|shipped|delivered|canceled&q=
 * The selected store's latest orders for the manager app, with a summary:
 * how many orders wait in each status and today's sales.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const orders = await listStoreOrders(req)
  const status = String(req.query.status ?? "")
  const q = String(req.query.q ?? "").trim().toLowerCase()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const today = orders.filter((o) => new Date(o.created_at as string) >= startOfDay && o.current !== "canceled")
  const counts = Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.current === s).length]))

  const filtered = orders.filter((o) => {
    if (status && o.current !== status) return false
    if (!q) return true
    const a = (o.shipping_address ?? {}) as Record<string, string | null>
    const hay = [String(o.display_id), a.first_name, a.last_name, a.phone, a.province, a.city].join(" ").toLowerCase()
    return hay.includes(q)
  })

  res.json({
    summary: {
      counts,
      today_orders: today.length,
      today_total: today.reduce((s, o) => s + Number(o.total ?? 0), 0),
    },
    orders: filtered.slice(0, 100),
  })
}
