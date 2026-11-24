import { MedusaError } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../../../../modules/app_content"
import type AppContentModuleService from "../../../../modules/app_content/service"
import { tenantFromAdminRequest } from "../../../../lib/tenant"
import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteStoryWorkflow, updateStoryWorkflow } from "../../../../workflows/app-content"
import type { UpdateStoryBody } from "../../../app-content-validators"

/** Stories can only be changed from the store they belong to. */
async function assertOwnStory(req: AuthenticatedMedusaRequest) {
  const tenant = await tenantFromAdminRequest(req)
  const story = await req.scope.resolve<AppContentModuleService>(APP_CONTENT_MODULE).retrieveStory(req.params.id)
  if (story.tenant_id !== tenant.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Story not found")
}

export const POST = async (req: AuthenticatedMedusaRequest<UpdateStoryBody>, res: MedusaResponse) => {
  await assertOwnStory(req)
  const { result } = await updateStoryWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json({ story: result })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await assertOwnStory(req)
  await deleteStoryWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, object: "app_story", deleted: true })
}
