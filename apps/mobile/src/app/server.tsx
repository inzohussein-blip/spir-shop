import { reloadAppAsync } from "expo"
import { useState } from "react"
import { Platform, StyleSheet, TextInput, View } from "react-native"
import Button from "../components/Button"
import Text from "../components/Text"
import { COLORS, DEFAULT_BACKEND_URL, FONTS, getBackendUrl, saveBackendUrl } from "../lib/config"

/**
 * Server address settings. Useful to try an APK against a store running on a
 * computer in the same Wi-Fi (e.g. http://192.168.1.10:9000) before deploying.
 */
export default function ServerSettings() {
  const [url, setUrl] = useState(getBackendUrl())
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const test = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch(`${url.trim().replace(/\/$/, "")}/health`)
      setStatus(res.ok ? { ok: true, text: "تم الاتصال بالخادم بنجاح" } : { ok: false, text: `رد الخادم برمز ${res.status}` })
    } catch {
      setStatus({ ok: false, text: "تعذّر الوصول للخادم. تأكد من العنوان ومن أن الهاتف على نفس الشبكة." })
    } finally {
      setBusy(false)
    }
  }

  const save = async (value: string | null) => {
    await saveBackendUrl(value)
    // Restart so every screen and cache uses the new server
    if (Platform.OS === "web") window.location.reload()
    else await reloadAppAsync()
  }

  return (
    <View style={styles.page}>
      <Text style={styles.label}>عنوان الخادم</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.1.10:9000"
        placeholderTextColor="#c4c4c4"
        style={styles.input}
        testID="server-url"
      />
      <Text style={styles.hint}>العنوان الافتراضي: {DEFAULT_BACKEND_URL}</Text>
      {status ? <Text style={{ color: status.ok ? COLORS.accent : COLORS.danger }}>{status.text}</Text> : null}
      <Button label="اختبار الاتصال" variant="outline" onPress={test} loading={busy} />
      <Button label="حفظ وإعادة التشغيل" onPress={() => save(url)} testID="server-save" />
      <Button label="الرجوع للعنوان الافتراضي" variant="outline" onPress={() => save(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bg, padding: 24, gap: 14 },
  label: { fontSize: 13, color: COLORS.muted },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    textAlign: "left",
    writingDirection: "ltr",
  },
  hint: { fontSize: 12, color: COLORS.muted },
})
