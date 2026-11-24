import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listTenants } from "../../../lib/tenant"

/**
 * GET /mobile/config - lets the app discover the store's publishable API key
 * from just the server address, so one APK (built by CI) works with any
 * server/database. Publishable keys are public by design (they ship in every
 * storefront bundle); they only scope requests to sales channels.
 */
const cors = (req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "content-type")
}

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  cors(req, res)
  res.status(204).send()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  cors(req, res)
  // ?store=<slug>: the app of that store (multi-store server)
  const slug = String(req.query.store ?? "")
  const tenants = await listTenants(req.scope).catch(() => [])
  const tenant = (slug && tenants.find((t) => t.slug === slug)) || tenants.find((t) => t.is_default)
  if (tenant) {
    res.setHeader("Cache-Control", "public, max-age=300")
    res.json({ publishable_key: tenant.status === "active" ? tenant.api_key_token : null, store: tenant.slug })
    return
  }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["token", "revoked_at", "created_at"],
    filters: { type: "publishable" },
  })
  const active = keys
    .filter((k) => !k.revoked_at)
    .sort((a, b) => new Date(a.created_at as Date).getTime() - new Date(b.created_at as Date).getTime())

  res.setHeader("Cache-Control", "public, max-age=300")
  res.json({ publishable_key: active[0]?.token ?? null })
}
