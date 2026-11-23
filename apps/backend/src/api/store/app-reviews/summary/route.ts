import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"

/** GET /store/app-reviews/summary?product_ids=a,b,c - average rating and count per product (for product cards). */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const ids = String(req.query.product_ids ?? "").split(",").filter(Boolean).slice(0, 100)
  if (!ids.length) {
    res.json({ ratings: {} })
    return
  }
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const reviews = await svc.listProductReviews({ product_id: ids, status: "approved" }, { take: 100000, select: ["product_id", "rating"] })
  const ratings: Record<string, { average: number; count: number }> = {}
  for (const r of reviews) {
    const cur = (ratings[r.product_id] ??= { average: 0, count: 0 })
    cur.average = (cur.average * cur.count + r.rating) / (cur.count + 1)
    cur.count++
  }
  for (const k of Object.keys(ratings)) ratings[k].average = Math.round(ratings[k].average * 10) / 10
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ ratings })
}
