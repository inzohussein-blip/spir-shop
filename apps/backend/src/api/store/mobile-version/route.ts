import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/mobile-version  (needs the publishable API key header, like all /store routes)
 *
 * Tells the mobile app which native (store) version is current so it can ask
 * users to update. Values are read from the store's metadata, so they can be
 * changed from the admin (Settings → Store → Metadata) without a redeploy;
 * environment variables are used as fallback.
 *
 *   mobile_latest_version   e.g. "1.2.0"  → older apps see a dismissible "update available" prompt
 *   mobile_min_version      e.g. "1.0.0"  → older apps are blocked until they update
 *   mobile_android_url      Google Play link
 *   mobile_ios_url          App Store link
 *   mobile_update_message   optional custom text shown in the prompt
 *
 * Small JS/UI changes don't need this: they ship instantly as OTA updates (expo-updates).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [store],
  } = await query.graph({ entity: "store", fields: ["metadata"], pagination: { take: 1 } })

  const meta = (store?.metadata ?? {}) as Record<string, unknown>
  const pick = (key: string, env: string, fallback = "") =>
    String(meta[key] ?? process.env[env] ?? fallback)

  res.setHeader("Cache-Control", "public, max-age=300")
  res.json({
    latest_version: pick("mobile_latest_version", "MOBILE_LATEST_VERSION", "1.0.0"),
    min_version: pick("mobile_min_version", "MOBILE_MIN_VERSION", "1.0.0"),
    android_url: pick("mobile_android_url", "MOBILE_ANDROID_URL"),
    ios_url: pick("mobile_ios_url", "MOBILE_IOS_URL"),
    message: pick("mobile_update_message", "MOBILE_UPDATE_MESSAGE"),
  })
}
