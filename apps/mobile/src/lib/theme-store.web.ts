/** Web build: theme names live in localStorage (see theme-store.ts). */
type Key = "user" | "store"
const k = (key: Key) => (key === "user" ? "spir_theme" : "spir_theme_default")

export function readThemeName(key: Key = "user"): string | null {
  try {
    return window.localStorage.getItem(k(key))
  } catch {
    return null
  }
}

export function writeThemeName(name: string, key: Key = "user") {
  try {
    window.localStorage.setItem(k(key), name)
  } catch {
    // ignore
  }
}
