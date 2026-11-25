import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { compareVersions, getLatestGithubRelease } from "../../../lib/github-release"
import { tenantFromStoreRequest } from "../../../lib/tenant"

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
 * With MOBILE_GITHUB_REPO set, the latest GitHub Release built by CI is merged in:
 * whichever is newer (admin values or the GitHub release) wins, so pushing a
 * version tag is enough to ship an update to every installed app.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const tenant = await tenantFromStoreRequest(req)
  // ?app=admin: the store manager's app, released next to the customer app (GitHub only)
  const app = req.query.app === "admin" ? "admin" : "customer"
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [store],
  } = await query.graph({ entity: "store", fields: ["metadata"], pagination: { take: 1 } })

  // admin-defined values belong to the default store's app; other stores use their own GitHub releases
  const meta = (tenant.is_default && app === "customer" ? store?.metadata ?? {} : {}) as Record<string, unknown>
  const pick = (key: string, env: string, fallback = "") =>
    String(meta[key] ?? process.env[env] ?? fallback)

  const info = {
    latest_version: pick("mobile_latest_version", "MOBILE_LATEST_VERSION", "1.0.0"),
    min_version: pick("mobile_min_version", "MOBILE_MIN_VERSION", "1.0.0"),
    android_url: pick("mobile_android_url", "MOBILE_ANDROID_URL"),
    ios_url: pick("mobile_ios_url", "MOBILE_IOS_URL"),
    message: pick("mobile_update_message", "MOBILE_UPDATE_MESSAGE"),
    source: "admin" as "admin" | "github",
  }

  const gh = await getLatestGithubRelease(tenant.is_default ? null : tenant.slug, app)
  if (gh && compareVersions(gh.version, info.latest_version) > 0) {
    info.latest_version = gh.version
    info.android_url = gh.apkUrl
    info.message = gh.notes || info.message
    info.source = "github"
    if (gh.required && compareVersions(gh.version, info.min_version) > 0) {
      info.min_version = gh.version
    }
  }

  res.setHeader("Cache-Control", "public, max-age=300")
  res.json(info)
}
