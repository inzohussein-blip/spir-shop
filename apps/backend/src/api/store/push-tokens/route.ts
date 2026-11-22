import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { registerPushTokenWorkflow } from "../../../workflows/app-content"
import type { RegisterPushTokenBody } from "../../app-content-validators"

/**
 * POST /store/push-tokens - the app registers (or refreshes) its Expo push token,
 * with the current cart id (for abandoned-cart reminders) and province (for targeting).
 */
export const POST = async (req: MedusaRequest<RegisterPushTokenBody>, res: MedusaResponse) => {
  const { result } = await registerPushTokenWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ ok: true, id: result.id })
}
