import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readAppSettings } from "../../../lib/app-settings"

/** GET /store/app-settings - free delivery threshold, contacts, delivery estimates, trust badges. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "store", fields: ["metadata"], pagination: { take: 1 } })
  res.setHeader("Cache-Control", "public, max-age=120")
  res.json({ settings: readAppSettings(data[0]?.metadata) })
}
