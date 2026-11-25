import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { orderTimeline } from "./order-status"
import { adminAccess, tenantFromAdminRequest } from "./tenant"

/**
 * Orders for the store manager's app: the orders of the selected store, with
 * the customer's contact details and the same status timeline the customer sees.
 */
export const ADMIN_ORDER_FIELDS = [
  "id",
  "display_id",
  "status",
  "created_at",
  "canceled_at",
  "currency_code",
  "email",
  "metadata",
  "sales_channel_id",
  "total",
  "item_total",
  "shipping_total",
  "discount_total",
  "items.id",
  "items.title",
  "items.product_title",
  "items.variant_title",
  "items.thumbnail",
  "items.quantity",
  "items.unit_price",
  "items.product_id",
  "shipping_address.first_name",
  "shipping_address.last_name",
  "shipping_address.phone",
  "shipping_address.province",
  "shipping_address.city",
  "shipping_address.address_1",
  "shipping_address.address_2",
  "shipping_methods.name",
  "fulfillments.id",
  "fulfillments.shipped_at",
  "fulfillments.delivered_at",
  "fulfillments.canceled_at",
]

type Fulfillment = { id: string; shipped_at?: Date | string | null; delivered_at?: Date | string | null; canceled_at?: Date | string | null }

export type AdminOrderRecord = {
  id: string
  display_id: number
  status: string
  created_at: Date | string
  canceled_at?: Date | string | null
  metadata?: Record<string, unknown> | null
  sales_channel_id?: string | null
  items?: ({ id: string; quantity: number } | null)[] | null
  fulfillments?: (Fulfillment | null)[] | null
  total?: number | string | null
  shipping_address?: Record<string, string | null> | null
  [key: string]: unknown
}

export const activeFulfillments = (o: AdminOrderRecord) =>
  ((o.fulfillments ?? []).filter((f) => f && !f.canceled_at) as Fulfillment[])

export function serializeOrder(o: AdminOrderRecord) {
  const { metadata, fulfillments, ...rest } = o
  const timeline = orderTimeline({ ...o, metadata, fulfillments: activeFulfillments(o) })
  return { ...rest, confirmed_at: (metadata?.confirmed_at as string | undefined) ?? null, ...timeline }
}

/** Latest orders of the store selected in the request (x-tenant-id), newest first. */
export async function listStoreOrders(req: MedusaRequest, take = 200) {
  const tenant = await tenantFromAdminRequest(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ADMIN_ORDER_FIELDS,
    filters: { sales_channel_id: tenant.sales_channel_id },
    pagination: { take, skip: 0, order: { created_at: "DESC" } },
  })
  return (data as unknown as AdminOrderRecord[]).map(serializeOrder)
}

/** One order, only if it belongs to a store the admin user manages. */
export async function loadOwnOrder(req: MedusaRequest, id: string): Promise<AdminOrderRecord> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "order", fields: ADMIN_ORDER_FIELDS, filters: { id } })
  const order = data[0] as unknown as AdminOrderRecord | undefined
  const access = await adminAccess(req)
  if (!order || (!access.platform && !access.tenants.some((t) => t.sales_channel_id === order.sales_channel_id))) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "الطلب غير موجود")
  }
  return order
}
