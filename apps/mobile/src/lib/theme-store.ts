import { File, Paths } from "expo-file-system"

/**
 * Theme names are read synchronously before any screen is drawn, so every style
 * can be built with the right colours. Changing the theme restarts the app.
 *  - "user": what the customer picked in Settings
 *  - "store": the store's default from the admin (cached for the next launch)
 */
type Key = "user" | "store"
const file = (key: Key) => new File(Paths.document, key === "user" ? "spir-theme.txt" : "spir-theme-default.txt")

export function readThemeName(key: Key = "user"): string | null {
  try {
    const f = file(key)
    return f.exists ? f.textSync().trim() : null
  } catch {
    return null
  }
}

export function writeThemeName(name: string, key: Key = "user") {
  try {
    file(key).write(name)
  } catch {
    // ignore: the default theme stays
  }
}
