import type { useRouter } from "expo-router"
import { Linking } from "react-native"

/**
 * Opens a link coming from the server (banners, stories, notifications).
 * Supported: app paths like "/product/<handle>", "/category/<id|all>", "/cart",
 * and external "https://..." URLs.
 */
export function openLink(router: ReturnType<typeof useRouter>, link?: string | null) {
  if (!link) return
  if (/^https?:\/\//.test(link)) {
    Linking.openURL(link)
    return
  }
  if (link.startsWith("/")) {
    router.push(link as never)
  }
}
