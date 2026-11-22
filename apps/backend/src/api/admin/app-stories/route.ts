import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { APP_CONTENT_MODULE } from "../../../modules/app_content"
import type AppContentModuleService from "../../../modules/app_content/service"
import { createStoryWorkflow } from "../../../workflows/app-content"
import type { CreateStoryBody } from "../../app-content-validators"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
  const stories = await svc.listStories({}, { order: { rank: "ASC", created_at: "DESC" }, take: 200 })
  res.json({ stories })
}

export const POST = async (req: AuthenticatedMedusaRequest<CreateStoryBody>, res: MedusaResponse) => {
  const { result } = await createStoryWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ story: result })
}
