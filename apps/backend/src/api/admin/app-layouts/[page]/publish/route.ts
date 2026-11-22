import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { publishAppLayoutWorkflow } from "../../../../../workflows/app-content"
import type { PublishLayoutBody } from "../../../../app-content-validators"

/** POST /admin/app-layouts/:page/publish - make the draft (or given blocks) live in the app. */
export const POST = async (req: AuthenticatedMedusaRequest<PublishLayoutBody>, res: MedusaResponse) => {
  const { result } = await publishAppLayoutWorkflow(req.scope).run({
    input: { page: req.params.page, blocks: req.validatedBody.blocks },
  })
  res.json({ layout: result })
}
