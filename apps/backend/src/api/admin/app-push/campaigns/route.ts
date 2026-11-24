import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { sendPushCampaignWorkflow } from "../../../../workflows/app-content"
import type { SendCampaignBody } from "../../../app-content-validators"
import { tenantFromAdminRequest } from "../../../../lib/tenant"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const campaigns = await svc.listPushCampaigns({ tenant_id: (await tenantFromAdminRequest(req)).id }, { order: { created_at: "DESC" }, take: 50 })
  res.json({ campaigns })
}

/** POST /admin/app-push/campaigns - send a push notification now. */
export const POST = async (req: AuthenticatedMedusaRequest<SendCampaignBody>, res: MedusaResponse) => {
  const { result } = await sendPushCampaignWorkflow(req.scope).run({
    input: { kind: "campaign", ...req.validatedBody, tenant_id: (await tenantFromAdminRequest(req)).id },
  })
  res.json({ campaign: result })
}
