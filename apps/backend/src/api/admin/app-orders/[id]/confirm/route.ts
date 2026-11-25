import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { adminAccess } from "../../../../../lib/tenant"
import { confirmOrderByPhoneWorkflow } from "../../../../../workflows/app-content/commerce"

/** POST /admin/app-orders/:id/confirm - mark the order as confirmed by phone and notify the customer. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const access = await adminAccess(req)
  if (!access.platform) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order", fields: ["id", "sales_channel_id"], filters: { id: req.params.id } })
    if (!data[0] || !access.tenants.some((t) => t.sales_channel_id === data[0].sales_channel_id)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    }
  }
  await confirmOrderByPhoneWorkflow(req.scope).run({
    input: { order_id: req.params.id, user_id: req.auth_context.actor_id },
  })
  res.json({ id: req.params.id, confirmed: true })
}
