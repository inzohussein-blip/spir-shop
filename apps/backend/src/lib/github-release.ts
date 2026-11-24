/**
 * Latest Android release from GitHub Releases (published by the
 * .github/workflows/android-apk.yml workflow).
 *
 * MOBILE_GITHUB_REPO = "owner/repo" turns it on. The repository must be public
 * (or set GITHUB_TOKEN with read access, but then the APK download link itself
 * also needs auth, so a public repo is the practical choice).
 *
 * Conventions used by the workflow:
 *   - tag "v1.2.3" -> version "1.2.3" (default store)
 *   - tag "glow-v1.2.3" -> version "1.2.3" of the "glow" store's app
 *   - an asset ending in ".apk" is the download
 *   - "[required]" in the release notes makes the update mandatory
 */
export type GithubRelease = { version: string; apkUrl: string; required: boolean; notes: string }

const CACHE_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; value: GithubRelease | null }>()

/** Latest release of a store's app: tags "vX.Y.Z" for the default store, "<slug>-vX.Y.Z" for the others. */
export async function getLatestGithubRelease(storeSlug?: string | null): Promise<GithubRelease | null> {
  const repo = process.env.MOBILE_GITHUB_REPO
  if (!repo) return null
  const key = storeSlug ?? ""
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value
  const prefix = storeSlug ? `${storeSlug}-v` : "v"

  let value: GithubRelease | null = null
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=50`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "spir-shop-backend",
        ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    })
    if (res.ok) {
      type Rel = {
        tag_name: string
        body: string | null
        draft: boolean
        prerelease: boolean
        assets: { name: string; browser_download_url: string }[]
      }
      const list = (await res.json()) as Rel[]
      const mine = list
        .filter((x) => !x.draft && !x.prerelease && x.tag_name.startsWith(prefix) && /^\d+\.\d+\.\d+$/.test(x.tag_name.slice(prefix.length)))
        .sort((a, b) => compareVersions(b.tag_name.slice(prefix.length), a.tag_name.slice(prefix.length)))
      const r = mine[0]
      const apk = r?.assets.find((a) => a.name.toLowerCase().endsWith(".apk"))
      const version = r ? r.tag_name.slice(prefix.length) : ""
      if (r && apk) {
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
  cache.set(key, { at: Date.now(), value })
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
