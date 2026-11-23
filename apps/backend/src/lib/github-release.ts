/**
 * Latest Android release from GitHub Releases (published by the
 * .github/workflows/android-apk.yml workflow).
 *
 * MOBILE_GITHUB_REPO = "owner/repo" turns it on. The repository must be public
 * (or set GITHUB_TOKEN with read access, but then the APK download link itself
 * also needs auth, so a public repo is the practical choice).
 *
 * Conventions used by the workflow:
 *   - tag "v1.2.3" -> version "1.2.3"
 *   - an asset ending in ".apk" is the download
 *   - "[required]" in the release notes makes the update mandatory
 */
export type GithubRelease = { version: string; apkUrl: string; required: boolean; notes: string }

const CACHE_MS = 10 * 60 * 1000
let cache: { at: number; value: GithubRelease | null } | null = null

export async function getLatestGithubRelease(): Promise<GithubRelease | null> {
  const repo = process.env.MOBILE_GITHUB_REPO
  if (!repo) return null
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value

  let value: GithubRelease | null = null
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "spir-shop-backend",
        ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    })
    if (res.ok) {
      const r = (await res.json()) as {
        tag_name: string
        body: string | null
        draft: boolean
        prerelease: boolean
        assets: { name: string; browser_download_url: string }[]
      }
      const apk = r.assets.find((a) => a.name.toLowerCase().endsWith(".apk"))
      const version = r.tag_name.replace(/^v/i, "")
      if (apk && !r.draft && !r.prerelease && /^\d+\.\d+\.\d+$/.test(version)) {
        const notes = (r.body ?? "").replace(/\[required\]/gi, "").trim()
        value = {
          version,
          apkUrl: apk.browser_download_url,
          required: /\[required\]/i.test(r.body ?? ""),
          notes: notes.split("\n")[0].slice(0, 200),
        }
      }
    }
  } catch {
    // GitHub unreachable: keep serving the admin-defined values
  }
  cache = { at: Date.now(), value }
  return value
}

/** Compare dotted versions: -1, 0 or 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0)
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}
