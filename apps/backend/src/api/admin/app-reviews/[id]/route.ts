import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { tenantFromAdminRequest } from "../../../../lib/tenant"
import { deleteReviewWorkflow, updateReviewStatusWorkflow } from "../../../../workflows/app-content/commerce"
import type { UpdateReviewBody } from "../../../app-content-validators"

/** Reviews can only be changed from the store they belong to. */
async function assertOwnReview(req: AuthenticatedMedusaRequest) {
  const tenant = await tenantFromAdminRequest(req)
  const review = await req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE).retrieveProductReview(req.params.id)
  const owner = review.tenant_id ?? (tenant.is_default ? tenant.id : null)
  if (owner !== tenant.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Review not found")
}

/** POST /admin/app-reviews/:id - show or hide a review. */
export const POST = async (req: AuthenticatedMedusaRequest<UpdateReviewBody>, res: MedusaResponse) => {
  await assertOwnReview(req)
  const { result } = await updateReviewStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: req.validatedBody.status },
  })
  res.json({ review: result })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await assertOwnReview(req)
  await deleteReviewWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, object: "app_product_review", deleted: true })
}
