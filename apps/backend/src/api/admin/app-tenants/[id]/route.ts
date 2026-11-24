import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { listTenants, tenantBranding, tenantFeatures } from "../../../../lib/tenant"
import { updateTenantWorkflow } from "../../../../workflows/app-content/commerce"
import type { UpdateTenantBody } from "../../../app-content-validators"

async function find(req: AuthenticatedMedusaRequest) {
  const t = (await listTenants(req.scope, true)).find((x) => x.id === req.params.id)
  if (!t) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found")
  return t
}

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const t = await find(req)
  res.json({ tenant: { ...t, branding: tenantBranding(t), features: tenantFeatures(t) } })
}

/** POST /admin/app-tenants/:id - name, status (suspend), branding, features. */
export const POST = async (req: AuthenticatedMedusaRequest<UpdateTenantBody>, res: MedusaResponse) => {
  const t = await find(req)
  const b = req.validatedBody
  if (t.is_default && b.status === "suspended") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "لا يمكن إيقاف المتجر الافتراضي")
  const { result } = await updateTenantWorkflow(req.scope).run({
    input: {
      id: t.id,
      ...(b.name ? { name: b.name } : {}),
      ...(b.status ? { status: b.status } : {}),
      ...(b.owner_email !== undefined ? { owner_email: b.owner_email } : {}),
      ...(b.branding ? { branding: { ...(t.branding ?? {}), ...b.branding } } : {}),
      ...(b.features ? { features: { ...(t.features ?? {}), ...b.features } } : {}),
    },
  })
  res.json({ tenant: result })
}
