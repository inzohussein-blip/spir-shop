import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Application from "expo-application"
import Constants from "expo-constants"
import * as Updates from "expo-updates"
import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, Platform } from "react-native"
import { getVersionInfo, VersionInfo } from "./api"
import { compareVersions } from "./format"

/* ------------------------------------------------------------------ *
 * 1) OTA updates (expo-updates / EAS Update)
 *    JS + UI changes published with `eas update` are downloaded in the
 *    background; when ready we offer "restart now" to apply them.
 * ------------------------------------------------------------------ */

const OTA_CHECK_INTERVAL_MS = 15 * 60 * 1000

export function useOtaUpdate() {
  const [ready, setReady] = useState(false)
  const lastCheck = useRef(0)

  const check = useCallback(async () => {
    // Only real release builds with an update URL can receive OTA updates
    if (__DEV__ || Platform.OS === "web" || !Updates.isEnabled) return
    if (Date.now() - lastCheck.current < OTA_CHECK_INTERVAL_MS) return
    lastCheck.current = Date.now()
    try {
      const result = await Updates.checkForUpdateAsync()
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync()
        setReady(true)
      }
    } catch {
      // Offline or server error: try again next time the app comes to foreground
      lastCheck.current = 0
    }
  }, [])

  useEffect(() => {
    check()
    const sub = AppState.addEventListener("change", (s) => s === "active" && check())
    return () => sub.remove()
  }, [check])

  const apply = useCallback(() => Updates.reloadAsync(), [])

  return { ready, apply, dismiss: () => setReady(false) }
}

/* ------------------------------------------------------------------ *
 * 2) Store (native) version check
 *    New native builds must go through Google Play / App Store. The
 *    backend (GET /store/mobile-version) says what's latest/minimum:
 *      - current < min_version     → "required": block the app
 *      - current < latest_version  → "optional": dismissible prompt
 * ------------------------------------------------------------------ */

export type StoreUpdateState =
  | { status: "ok" }
  | { status: "optional" | "required"; latest: string; url: string; message: string }

const DISMISSED_KEY = "spir_dismissed_store_version"

export function getCurrentAppVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "0.0.0"
}

export function evaluateVersion(current: string, info: VersionInfo, platform: string): StoreUpdateState {
  const url = platform === "ios" ? info.ios_url : info.android_url
  if (info.min_version && compareVersions(current, info.min_version) < 0) {
    return { status: "required", latest: info.latest_version, url, message: info.message }
  }
  if (info.latest_version && compareVersions(current, info.latest_version) < 0) {
    return { status: "optional", latest: info.latest_version, url, message: info.message }
  }
  return { status: "ok" }
}

export function useStoreUpdate() {
  const [state, setState] = useState<StoreUpdateState>({ status: "ok" })

  const check = useCallback(async () => {
    try {
      const info = await getVersionInfo()
      const next = evaluateVersion(getCurrentAppVersion(), info, Platform.OS)
      if (next.status === "optional") {
        const dismissed = await AsyncStorage.getItem(DISMISSED_KEY)
        if (dismissed === next.latest) return setState({ status: "ok" })
      }
      setState(next)
    } catch {
      // Never block the shop because the check failed
    }
  }, [])

  useEffect(() => {
    check()
    const sub = AppState.addEventListener("change", (s) => s === "active" && check())
    return () => sub.remove()
  }, [check])

  const dismiss = useCallback(async () => {
    if (state.status === "optional") await AsyncStorage.setItem(DISMISSED_KEY, state.latest)
    setState({ status: "ok" })
  }, [state])

  return { state, dismiss }
}
