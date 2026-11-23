import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../../../modules/app_content"
import type AppContentModuleService from "../../../modules/app_content/service"

/** GET /admin/app-reviews - latest reviews with product titles, for moderation. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const reviews = await svc.listProductReviews({}, { order: { created_at: "DESC" }, take: 200 })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const ids = [...new Set(reviews.map((r) => r.product_id))]
  const { data: products } = ids.length
    ? await query.graph({ entity: "product", fields: ["id", "title", "thumbnail"], filters: { id: ids } })
    : { data: [] as { id: string; title: string; thumbnail: string | null }[] }
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  res.json({ reviews: reviews.map((r) => ({ ...r, product: byId[r.product_id] ?? null })) })
}
