import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { tenantSettings, tenantFromStoreRequest } from "../../../lib/tenant"

/** GET /store/app-settings - the store's free delivery threshold, contacts, delivery estimates, trust badges. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const tenant = await tenantFromStoreRequest(req)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ settings: tenantSettings(tenant) })
}
