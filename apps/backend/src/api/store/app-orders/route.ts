import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { orderTimeline } from "../../../lib/order-status"

/**
 * GET /store/app-orders?ids=order_1,order_2 - the orders placed from this device
 * (the app keeps their ids), with a customer-facing status timeline.
 * Order ids are long random identifiers, like Medusa's own GET /store/orders/:id.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const ids = String(req.query.ids ?? "").split(",").filter((x) => /^order_[A-Za-z0-9]+$/.test(x)).slice(0, 50)
  if (!ids.length) {
    res.json({ orders: [] })
    return
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "created_at",
      "canceled_at",
      "metadata",
      "total",
      "item_total",
      "shipping_total",
      "items.id",
      "items.title",
      "items.product_title",
      "items.variant_title",
      "items.thumbnail",
      "items.quantity",
      "items.product_id",
      "items.product_handle",
      "items.unit_price",
      "shipping_address.province",
      "shipping_address.city",
      "shipping_address.address_1",
      "shipping_methods.name",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
    ],
    filters: { id: ids },
  })
  const orders = data
    .map((o) => {
      const { metadata, fulfillments, ...rest } = o
      return { ...rest, ...orderTimeline({ ...o, metadata, fulfillments } as never) }
    })
    .sort((a, b) => new Date(b.created_at as Date).getTime() - new Date(a.created_at as Date).getTime())
  res.json({ orders })
}
