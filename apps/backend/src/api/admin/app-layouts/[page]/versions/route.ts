import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../../modules/app_content"
import type AppContentModuleService from "../../../../../modules/app_content/service"

/** GET /admin/app-layouts/:page/versions - publish history (newest first). */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const versions = await svc.listAppLayoutVersions(
    { page: req.params.page },
    { order: { version: "DESC" }, take: 50, select: ["id", "version", "created_at"] }
  )
  res.json({ versions })
}
