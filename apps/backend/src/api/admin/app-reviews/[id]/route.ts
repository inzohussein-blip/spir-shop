import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteReviewWorkflow, updateReviewStatusWorkflow } from "../../../../workflows/app-content/commerce"
import type { UpdateReviewBody } from "../../../app-content-validators"

/** POST /admin/app-reviews/:id - show or hide a review. */
export const POST = async (req: AuthenticatedMedusaRequest<UpdateReviewBody>, res: MedusaResponse) => {
  const { result } = await updateReviewStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: req.validatedBody.status },
  })
  res.json({ review: result })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await deleteReviewWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, object: "app_product_review", deleted: true })
}
