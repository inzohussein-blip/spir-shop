import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { tenantFromAdminRequest, tenantSettings } from "../../../lib/tenant"
import { saveAppSettingsWorkflow, updateTenantWorkflow } from "../../../workflows/app-content/commerce"
import type { SaveAppSettingsBody } from "../../app-content-validators"

/** GET /admin/app-settings - settings of the store selected in the admin. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json({ settings: tenantSettings(await tenantFromAdminRequest(req)) })
}

/**
 * POST /admin/app-settings - save the selected store's settings. Delivery prices
 * are shared by all stores on the server, so the free-delivery threshold is
 * applied to them only from the default store.
 */
export const POST = async (req: AuthenticatedMedusaRequest<SaveAppSettingsBody>, res: MedusaResponse) => {
  const tenant = await tenantFromAdminRequest(req)
  await updateTenantWorkflow(req.scope).run({
    input: { id: tenant.id, settings: req.validatedBody, branding: { ...(tenant.branding ?? {}), theme: req.validatedBody.default_theme } },
  })
  if (tenant.is_default) await saveAppSettingsWorkflow(req.scope).run({ input: { settings: req.validatedBody } })
  res.json({ settings: req.validatedBody })
}
