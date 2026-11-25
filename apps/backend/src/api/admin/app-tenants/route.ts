import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { adminAccess, listTenants, requirePlatformAdmin, tenantBranding, tenantFeatures } from "../../../lib/tenant"
import { createTenantWorkflow, tenantCounts } from "../../../workflows/app-content/tenants"
import type { CreateTenantBody } from "../../app-content-validators"

/** GET /admin/app-tenants - the stores this admin manages (all of them for a platform admin), with counts. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { platform, tenants } = await adminAccess(req, true)
  const counts = await tenantCounts(req.scope, tenants.map((t) => t.sales_channel_id))
  res.json({
    platform,
    tenants: tenants.map((t) => ({
      ...t,
      branding: tenantBranding(t),
      features: tenantFeatures(t),
      counts: counts[t.sales_channel_id],
    })),
  })
}

/** POST /admin/app-tenants - create a store (sales channel + app key + settings). */
export const POST = async (req: AuthenticatedMedusaRequest<CreateTenantBody>, res: MedusaResponse) => {
  await requirePlatformAdmin(req)
  const body = req.validatedBody
  const existing = await listTenants(req.scope, true)
  if (existing.some((t) => t.slug === body.slug)) {
    throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "هذا الاسم المختصر مستخدم لمتجر آخر")
  }
  const { result } = await createTenantWorkflow(req.scope).run({
    input: { ...body, branding: { app_name: body.name, theme: "elegant", ...(body.branding ?? {}) } },
  })
  res.json({ tenant: result })
}
