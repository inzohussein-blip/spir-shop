import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { rollbackAppLayoutWorkflow } from "../../../../../workflows/app-content"
import type { RollbackLayoutBody } from "../../../../app-content-validators"
import { tenantFromAdminRequest } from "../../../../../lib/tenant"

/** POST /admin/app-layouts/:page/rollback - re-publish an older version. */
export const POST = async (req: AuthenticatedMedusaRequest<RollbackLayoutBody>, res: MedusaResponse) => {
  const { result } = await rollbackAppLayoutWorkflow(req.scope).run({
    input: { tenant_id: (await tenantFromAdminRequest(req)).id, page: req.params.page, version: req.validatedBody.version },
  })
  res.json({ layout: result })
}
