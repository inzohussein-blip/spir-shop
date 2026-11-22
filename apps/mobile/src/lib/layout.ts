import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { Platform } from "react-native"
import { Block, getLayout } from "./api"

const cacheKey = (page: string) => `spir_layout_${page}`

/**
 * Loads the server-driven layout for a page.
 * - Shows the cached layout instantly (works offline), then refreshes from the server.
 * - On web, the admin builder can push a draft into an embedded preview with
 *   window.postMessage({ type: "spir:preview-layout", page, blocks }).
 */
export function useLayout(page: string) {
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const layout = await getLayout(page)
      setError(false)
      setBlocks((current) => (preview ? current : layout.blocks))
      await AsyncStorage.setItem(cacheKey(page), JSON.stringify(layout.blocks))
    } catch {
      setError(true)
    }
  }, [page, preview])

  useEffect(() => {
    AsyncStorage.getItem(cacheKey(page)).then((cached) => {
      if (cached) setBlocks((b) => b ?? JSON.parse(cached))
    })
    refresh()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; page?: string; blocks?: Block[] }
      if (d?.type === "spir:preview-layout" && d.page === page && Array.isArray(d.blocks)) {
        setPreview(true)
        setBlocks(d.blocks)
      }
    }
    window.addEventListener("message", onMessage)
    // Tell a parent builder window we are ready to receive a preview
    window.parent?.postMessage({ type: "spir:preview-ready", page }, "*")
    return () => window.removeEventListener("message", onMessage)
  }, [page])

  return { blocks, error: error && !blocks, refresh, preview }
}
