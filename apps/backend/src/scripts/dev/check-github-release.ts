import type { ExecArgs } from "@medusajs/framework/types"
import { getLatestGithubRelease } from "../../lib/github-release"

/**
 * Dev check: prints what the app update check reads from GitHub Releases.
 *   MOBILE_GITHUB_REPO=owner/repo npx medusa exec ./src/scripts/dev/check-github-release.ts
 * With MOCK_GITHUB=1 it answers from a sample GitHub API payload instead.
 */
export default async function checkGithubRelease(_: ExecArgs) {
  if (process.env.MOCK_GITHUB) {
    process.env.MOBILE_GITHUB_REPO ||= "owner/repo"
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          tag_name: "v1.2.0",
          draft: false,
          prerelease: false,
          body: "تحسينات على صفحة المنتج وإضافة العلامات التجارية\n[required]\n- details",
          assets: [
            { name: "output-metadata.json", browser_download_url: "https://example.com/meta.json" },
            { name: "spir-shop-1.2.0.apk", browser_download_url: "https://github.com/o/r/releases/download/v1.2.0/spir-shop-1.2.0.apk" },
          ],
        })
      )) as typeof fetch
  }
  console.log("GITHUB_RELEASE", JSON.stringify(await getLatestGithubRelease()))
}
