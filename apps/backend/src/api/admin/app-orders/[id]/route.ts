import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadOwnOrder, serializeOrder } from "../../../../lib/admin-orders"

/** GET /admin/app-orders/:id - one order with the customer's contact details and status timeline. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json({ order: serializeOrder(await loadOwnOrder(req, req.params.id)) })
}
