import { useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Header from "../components/Header"
import Icon from "../components/Icon"
import Text from "../components/Text"
import { applyTheme, COLORS, SHADOW, THEME_NAME, THEMES, ThemeName } from "../lib/config"

/** Mini phone drawing of each theme so the customer sees the difference before choosing. */
const PREVIEW: Record<ThemeName, { bg: string; card: string; primary: string; onPrimary: string; dark: string; round: number; floating: boolean }> = {
  elegant: { bg: "#ffffff", card: "#f3f3f3", primary: "#343434", onPrimary: "#ffffff", dark: "#3a2c27", round: 8, floating: false },
  natural: { bg: "#f6f6f3", card: "#ffffff", primary: "#9cc43a", onPrimary: "#11140e", dark: "#111111", round: 14, floating: true },
}

function Mini({ name }: { name: ThemeName }) {
  const p = PREVIEW[name]
  return (
    <View style={[styles.phone, { backgroundColor: p.bg }]}>
      <View style={[styles.miniBanner, { backgroundColor: name === "natural" ? p.primary : "#b78a95", borderRadius: p.round }]} />
      <View style={{ flexDirection: "row", gap: 6 }}>
        <View style={[styles.miniCard, { backgroundColor: p.card, borderRadius: p.round }]} />
        <View style={[styles.miniCard, { backgroundColor: p.card, borderRadius: p.round }]} />
      </View>
      <View style={[styles.miniBtn, { backgroundColor: p.primary, borderRadius: 12 }]} />
      <View style={[styles.miniTab, p.floating ? { borderRadius: 12, marginHorizontal: 6, bottom: 8, ...SHADOW, shadowOpacity: 0.12 } : { borderTopWidth: 1, borderColor: "#eee" }]}>
        <View style={[styles.miniDot, { backgroundColor: p.floating ? p.primary : p.dark, width: p.floating ? 22 : 8 }]} />
        <View style={styles.miniDot} />
        <View style={styles.miniDot} />
        <View style={styles.miniDot} />
      </View>
    </View>
  )
}

/** Settings > Appearance: pick "elegant" or "natural". The app restarts to apply it. */
export default function ThemeScreen() {
  const [busy, setBusy] = useState<ThemeName | null>(null)
  const choose = async (name: ThemeName) => {
    if (name === THEME_NAME) return
    setBusy(name)
    await applyTheme(name)
  }
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageAlt }}>
      <Header title="المظهر" />
      <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
        <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 21 }}>اختار شكل التطبيق. راح يعاد تشغيل التطبيق حتى يتطبّق المظهر على كل الشاشات.</Text>
        {(Object.keys(THEMES) as ThemeName[]).map((name) => {
          const on = name === THEME_NAME
          return (
            <Pressable key={name} onPress={() => choose(name)} style={[styles.card, on && { borderColor: COLORS.primary, borderWidth: 2 }]} testID={`theme-${name}`}>
              <Mini name={name} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>{THEMES[name].label}</Text>
                <Text style={{ fontSize: 13, color: COLORS.muted }}>{THEMES[name].description}</Text>
                {on ? (
                  <View style={styles.current}>
                    <Icon name="check" size={13} color={COLORS.onPrimary} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.onPrimary }}>المظهر الحالي</Text>
                  </View>
                ) : busy === name ? (
                  <ActivityIndicator color={COLORS.primary} style={{ alignSelf: "flex-start" }} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.accent }}>اختيار</Text>
                )}
              </View>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 18, backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: "transparent", ...SHADOW },
  phone: { width: 92, height: 160, borderRadius: 16, borderWidth: 1, borderColor: "#e5e5e5", padding: 8, gap: 6, overflow: "hidden" },
  miniBanner: { height: 38 },
  miniCard: { flex: 1, height: 44 },
  miniBtn: { height: 14 },
  miniTab: { position: "absolute", left: 0, right: 0, bottom: 0, height: 22, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  miniDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#cfcfcf" },
  current: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
})
