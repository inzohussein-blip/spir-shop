import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { confirmOrderByPhoneWorkflow } from "../../../../../workflows/app-content/commerce"

/** POST /admin/app-orders/:id/confirm - mark the order as confirmed by phone and notify the customer. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await confirmOrderByPhoneWorkflow(req.scope).run({
    input: { order_id: req.params.id, user_id: req.auth_context.actor_id },
  })
  res.json({ id: req.params.id, confirmed: true })
}
