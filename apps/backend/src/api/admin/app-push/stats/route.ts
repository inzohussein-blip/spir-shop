import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { tenantFromAdminRequest } from "../../../../lib/tenant"

/** GET /admin/app-push/stats - how many devices can receive notifications, per province. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const tokens = await svc.listPushTokens({ enabled: true, tenant_id: (await tenantFromAdminRequest(req)).id }, { select: ["province"], take: 100000 })
  const by_province: Record<string, number> = {}
  for (const t of tokens) {
    const key = t.province || "غير محدد"
    by_province[key] = (by_province[key] ?? 0) + 1
  }
  res.json({ total: tokens.length, by_province })
}
