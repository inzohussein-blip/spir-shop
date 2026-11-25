import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadOwnOrder, serializeOrder } from "../../../../../lib/admin-orders"
import { deliverWholeOrderWorkflow } from "../../../../../workflows/app-admin/orders"

/** POST /admin/app-orders/:id/deliver - the courier delivered the order (the customer gets a notification). */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const order = await loadOwnOrder(req, req.params.id)
  await deliverWholeOrderWorkflow(req.scope).run({ input: { order_id: order.id, user_id: req.auth_context.actor_id } })
  res.json({ order: serializeOrder(await loadOwnOrder(req, order.id)) })
}
