import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteStoryWorkflow, updateStoryWorkflow } from "../../../../workflows/app-content"
import type { UpdateStoryBody } from "../../../app-content-validators"

export const POST = async (req: AuthenticatedMedusaRequest<UpdateStoryBody>, res: MedusaResponse) => {
  const { result } = await updateStoryWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json({ story: result })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await deleteStoryWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, object: "app_story", deleted: true })
}
