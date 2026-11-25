import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { loadOwnOrder, serializeOrder } from "../../../../../lib/admin-orders"

/** POST /admin/app-orders/:id/cancel - cancel an order that hasn't been shipped yet. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const order = await loadOwnOrder(req, req.params.id)
  await cancelOrderWorkflow(req.scope).run({ input: { order_id: order.id, canceled_by: req.auth_context.actor_id } })
  res.json({ order: serializeOrder(await loadOwnOrder(req, order.id)) })
}
