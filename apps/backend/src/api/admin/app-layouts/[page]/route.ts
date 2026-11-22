import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { defaultBlocksFor } from "../../../../lib/app-blocks"
import { saveAppLayoutDraftWorkflow } from "../../../../workflows/app-content"
import type { SaveLayoutBody } from "../../../app-content-validators"

/** GET /admin/app-layouts/:page - draft + published state for the builder. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const [layout] = await svc.listAppLayouts({ page: req.params.page })
  res.json({
    layout: layout ?? {
      page: req.params.page,
      draft: { blocks: defaultBlocksFor(req.params.page) },
      published: null,
      version: 0,
      published_at: null,
    },
  })
}

/** POST /admin/app-layouts/:page - save the draft (not visible in the app until published). */
export const POST = async (req: AuthenticatedMedusaRequest<SaveLayoutBody>, res: MedusaResponse) => {
  const { result } = await saveAppLayoutDraftWorkflow(req.scope).run({
    input: { page: req.params.page, blocks: req.validatedBody.blocks },
  })
  res.json({ layout: result })
}
