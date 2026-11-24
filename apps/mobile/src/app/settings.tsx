import { useRouter } from "expo-router"
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native"
import Header from "../components/Header"
import Icon, { IconName } from "../components/Icon"
import Text from "../components/Text"
import { COLORS, THEME_NAME, THEMES } from "../lib/config"

/** Settings (design: "setting"). */
export default function SettingsScreen() {
  const router = useRouter()
  const rows: { icon: IconName; label: string; hint?: string; onPress: () => void }[] = [
    { icon: "droplet", label: "المظهر", hint: THEMES[THEME_NAME].label, onPress: () => router.push("/theme") },
    { icon: "globe", label: "اللغة", hint: "العربية", onPress: () => undefined },
    { icon: "bell", label: "الإشعارات", onPress: () => (Platform.OS === "web" ? router.push("/notifications") : Linking.openSettings()) },
    { icon: "file-text", label: "الشروط والأحكام", onPress: () => router.push({ pathname: "/about", params: { section: "terms" } }) },
    { icon: "info", label: "سياسة الخصوصية", onPress: () => router.push({ pathname: "/about", params: { section: "privacy" } }) },
    { icon: "send", label: "الدعم والمحادثة", onPress: () => router.push("/support") },
  ]
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title="الإعدادات" right={null} />
      <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
        {rows.map((r) => (
          <Pressable key={r.label} style={styles.row} onPress={r.onPress} testID={`settings-${r.icon}`}>
            <Icon name={r.icon} size={19} color="#5a5a6a" />
            <Text style={styles.text}>{r.label}</Text>
            {r.hint ? <Text style={styles.hint}>{r.hint}</Text> : null}
            <Icon name="chevron-left" size={20} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 16, height: 70, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  text: { flex: 1, fontSize: 14, color: "#3a3a4a" },
  hint: { fontSize: 12, color: COLORS.muted },
})
