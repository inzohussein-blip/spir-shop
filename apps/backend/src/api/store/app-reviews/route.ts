import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../../../modules/app_content"
import type AppContentModuleService from "../../../modules/app_content/service"
import { createReviewWorkflow } from "../../../workflows/app-content/commerce"
import type { CreateReviewBody } from "../../app-content-validators"

/** GET /store/app-reviews?product_id= - visible reviews with a rating summary. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productId = String(req.query.product_id ?? "")
  if (!productId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "product_id is required")
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const reviews = await svc.listProductReviews(
    { product_id: productId, status: "approved" },
    { order: { created_at: "DESC" }, take: 200, select: ["id", "rating", "name", "comment", "created_at"] }
  )
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }))
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  res.json({
    summary: { average: Math.round(average * 10) / 10, count: reviews.length, distribution },
    reviews: reviews.slice(0, 50).map((r) => ({ ...r, name: r.name.split(" ")[0] })),
  })
}

/** POST /store/app-reviews - review a product from one of your orders (verified purchase). */
export const POST = async (req: MedusaRequest<CreateReviewBody>, res: MedusaResponse) => {
  const { result } = await createReviewWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ review: { id: result.id, rating: result.rating } })
}
