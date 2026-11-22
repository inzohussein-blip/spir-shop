import { useState } from "react"
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from "react-native"
import { downloadAndInstallApk, isApkUrl } from "../lib/apk-update"
import { COLORS } from "../lib/config"
import { useOtaUpdate, useStoreUpdate } from "../lib/updates"
import Text from "./Text"

/** Renders the update UI: blocking screen, "new version" dialog, and OTA "restart" banner. */
export default function UpdatePrompts() {
  const ota = useOtaUpdate()
  const store = useStoreUpdate()
  const s = store.state

  const [progress, setProgress] = useState<number | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  /** Google Play / App Store link: open it. Direct APK link on Android: download and install in-app. */
  const openStore = async () => {
    if (s.status === "ok" || !s.url) return
    if (Platform.OS === "android" && isApkUrl(s.url)) {
      setFailed(null)
      setProgress(0)
      try {
        await downloadAndInstallApk(s.url, setProgress)
      } catch (e) {
        setFailed((e as Error).message)
      } finally {
        setProgress(null)
      }
      return
    }
    Linking.openURL(s.url)
  }

  const updateLabel = (idle: string) =>
    progress === null ? idle : `جاري التحميل ${Math.round(progress * 100)}%`

  return (
    <>
      {/* Required native update: cannot be dismissed */}
      <Modal visible={s.status === "required"} animationType="fade" transparent={false}>
        <View style={styles.blocking}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>يلزم تحديث التطبيق</Text>
          <Text style={styles.body}>
            {(s.status !== "ok" && s.message) ||
              "هذه النسخة لم تعد مدعومة. حدّث التطبيق من المتجر حتى تكمل التسوق."}
          </Text>
          <Pressable style={styles.primary} onPress={openStore} disabled={progress !== null} testID="store-update-required">
            <Text style={styles.primaryText}>{updateLabel("تحديث الآن")}</Text>
          </Pressable>
          {failed ? <Text style={styles.error}>{failed}</Text> : null}
        </View>
      </Modal>

      {/* Optional native update */}
      <Modal visible={s.status === "optional"} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>نسخة جديدة متوفرة ✨</Text>
            <Text style={styles.body}>
              {(s.status !== "ok" && s.message) ||
                `النسخة ${s.status !== "ok" ? s.latest : ""} متوفرة الآن بميزات وتحسينات جديدة.`}
            </Text>
            <Pressable style={styles.primary} onPress={openStore} disabled={progress !== null} testID="store-update-optional">
              <Text style={styles.primaryText}>{updateLabel("تحديث")}</Text>
            </Pressable>
            {failed ? <Text style={styles.error}>{failed}</Text> : null}
            <Pressable style={styles.secondary} onPress={store.dismiss}>
              <Text style={styles.secondaryText}>لاحقاً</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* OTA update downloaded in the background */}
      {ota.ready && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>تحديث جديد جاهز</Text>
          <Pressable onPress={ota.apply} style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>إعادة التشغيل</Text>
          </Pressable>
          <Pressable onPress={ota.dismiss} hitSlop={10}>
            <Text style={styles.bannerClose}>✕</Text>
          </Pressable>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  blocking: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: COLORS.soft, gap: 12 },
  emoji: { fontSize: 48 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: COLORS.primaryDark },
  body: { fontSize: 15, textAlign: "center", color: COLORS.muted, lineHeight: 24 },
  primary: { backgroundColor: COLORS.primary, borderRadius: 24, height: 48, justifyContent: "center", alignSelf: "stretch", marginTop: 8 },
  error: { color: COLORS.danger, textAlign: "center", fontSize: 13 },
  primaryText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
  secondary: { paddingVertical: 10 },
  secondaryText: { color: COLORS.muted, textAlign: "center" },
  banner: {
    position: "absolute", bottom: 90, left: 16, right: 16, backgroundColor: COLORS.primaryDark,
    borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 12,
  },
  bannerText: { color: "#fff", flex: 1, fontWeight: "600" },
  bannerBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  bannerBtnText: { color: COLORS.primaryDark, fontWeight: "700" },
  bannerClose: { color: "#fff", fontSize: 16 },
})
