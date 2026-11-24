import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { defaultBlocksFor } from "../../../../lib/app-blocks"
import { tenantFromStoreRequest } from "../../../../lib/tenant"

/**
 * GET /store/app-layouts/:page - the published layout the app renders.
 * Falls back to the built-in default until the merchant publishes a design.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const tenant = await tenantFromStoreRequest(req)
  const [layout] = await svc.listAppLayouts({ page: req.params.page, tenant_id: tenant.id })
  const published = layout?.published as { blocks?: unknown[] } | null | undefined

  res.setHeader("Cache-Control", "public, max-age=30")
  res.json({
    page: req.params.page,
    version: layout?.published ? layout.version : 0,
    published_at: layout?.published_at ?? null,
    blocks: published?.blocks ?? defaultBlocksFor(req.params.page),
  })
}
