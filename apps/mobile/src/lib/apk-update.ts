import * as FileSystem from "expo-file-system/legacy"
import * as IntentLauncher from "expo-intent-launcher"
import { Linking, Platform } from "react-native"

/** True when the update link points to an APK file (direct install, outside Google Play). */
export const isApkUrl = (url: string) => /\.apk(\?|#|$)/i.test(url)

const FLAG_GRANT_READ_URI_PERMISSION = 1

/**
 * Downloads the new APK and opens Android's package installer.
 * The user confirms the install; Android keeps the app data because the
 * new APK is signed with the same key.
 * Needs the REQUEST_INSTALL_PACKAGES permission (see app.json).
 */
export async function downloadAndInstallApk(url: string, onProgress?: (fraction: number) => void) {
  if (Platform.OS !== "android") {
    await Linking.openURL(url)
    return
  }
  const target = `${FileSystem.cacheDirectory}spir-update.apk`
  await FileSystem.deleteAsync(target, { idempotent: true })

  const download = FileSystem.createDownloadResumable(url, target, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite)
  })
  const result = await download.downloadAsync()
  if (!result || result.status !== 200) {
    throw new Error("فشل تحميل التحديث")
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri)
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: contentUri,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
    type: "application/vnd.android.package-archive",
  })
}
