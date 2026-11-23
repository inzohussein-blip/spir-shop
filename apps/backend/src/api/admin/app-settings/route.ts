import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readAppSettings } from "../../../lib/app-settings"
import { saveAppSettingsWorkflow } from "../../../workflows/app-content/commerce"
import type { SaveAppSettingsBody } from "../../app-content-validators"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "store", fields: ["metadata"], pagination: { take: 1 } })
  res.json({ settings: readAppSettings(data[0]?.metadata) })
}

/** POST /admin/app-settings - save settings and apply the free-delivery threshold to shipping prices. */
export const POST = async (req: AuthenticatedMedusaRequest<SaveAppSettingsBody>, res: MedusaResponse) => {
  const { result } = await saveAppSettingsWorkflow(req.scope).run({ input: { settings: req.validatedBody } })
  res.json({ settings: result })
}
