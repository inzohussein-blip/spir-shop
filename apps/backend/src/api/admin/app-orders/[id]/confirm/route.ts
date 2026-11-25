import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { loadOwnOrder, serializeOrder } from "../../../../../lib/admin-orders"
import { confirmOrderByPhoneWorkflow } from "../../../../../workflows/app-content/commerce"

/** POST /admin/app-orders/:id/confirm - mark the order as confirmed by phone and notify the customer. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const order = await loadOwnOrder(req, req.params.id)
  if (order.status === "canceled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب ملغى")
  await confirmOrderByPhoneWorkflow(req.scope).run({
    input: { order_id: order.id, user_id: req.auth_context.actor_id },
  })
  res.json({ id: order.id, confirmed: true, order: serializeOrder(await loadOwnOrder(req, order.id)) })
}
