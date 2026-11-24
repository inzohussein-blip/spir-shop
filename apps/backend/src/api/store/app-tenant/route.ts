import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { tenantBranding, tenantFeatures, tenantFromStoreRequest, tenantSettings } from "../../../lib/tenant"

/**
 * GET /store/app-tenant - everything the app needs to dress itself as this
 * store: name, logo, theme, which features are on, and the store settings.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const t = await tenantFromStoreRequest(req)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({
    tenant: {
      id: t.id,
      slug: t.slug,
      name: t.name,
      branding: tenantBranding(t),
      features: tenantFeatures(t),
      settings: tenantSettings(t),
    },
  })
}
