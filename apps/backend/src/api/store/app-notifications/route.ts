import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../modules/app_content"
import type AppContentModuleService from "../../../modules/app_content/service"

/**
 * GET /store/app-notifications?province= - recent marketing notifications for
 * the in-app notifications list (all-customer ones plus the customer's province).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const province = String(req.query.province ?? "")
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const campaigns = await svc.listPushCampaigns(
    { kind: "campaign", status: "sent" },
    { order: { sent_at: "DESC" }, take: 50 }
  )
  const notifications = campaigns
    .filter((c) => {
      const a = (c.audience ?? {}) as { province?: string | null; token_ids?: string[] }
      if (a.token_ids?.length) return false // personal (order status) messages
      return !a.province || a.province === province
    })
    .slice(0, 30)
    .map((c) => ({ id: c.id, title: c.title, body: c.body, link: c.link, sent_at: c.sent_at }))
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ notifications })
}
