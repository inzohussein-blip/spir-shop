import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../modules/app_content"
import type AppContentModuleService from "../../../modules/app_content/service"
import { tenantFromStoreRequest } from "../../../lib/tenant"

/** GET /store/app-stories - active stories within their start/expiry window. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const now = Date.now()
  const stories = (
    await svc.listStories({ is_active: true, tenant_id: (await tenantFromStoreRequest(req)).id }, { order: { rank: "ASC", created_at: "DESC" }, take: 50 })
  )
    .filter((s) => !s.starts_at || new Date(s.starts_at).getTime() <= now)
    .filter((s) => !s.expires_at || new Date(s.expires_at).getTime() > now)
    .map((s) => ({
      id: s.id,
      title: s.title,
      media_url: s.media_url,
      media_type: s.media_type,
      thumbnail_url: s.thumbnail_url,
      link: s.link,
      cta_label: s.cta_label,
    }))

  res.setHeader("Cache-Control", "public, max-age=30")
  res.json({ stories })
}
