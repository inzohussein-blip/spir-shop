import { Linking, Pressable, StyleSheet, View } from "react-native"
import Header from "../components/Header"
import Icon from "../components/Icon"
import Text from "../components/Text"
import { COLORS, SHADOW } from "../lib/config"
import { contactLinks } from "../lib/contact"
import { useStore } from "../lib/store"

/** Support (design: "chat support"): the store's chat channels. */
export default function SupportScreen() {
  const { settings } = useStore()
  const links = contactLinks(settings, "مرحبا، عندي استفسار")
  return (
    <View style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <Header title="الدعم" />
      <View style={{ padding: 24, gap: 16 }}>
        <View style={styles.bubble}>
          <Text style={{ fontSize: 14, lineHeight: 22 }}>أهلاً بيج 👋 فريق Spir Shop جاهز يساعدج. اختاري طريقة التواصل:</Text>
        </View>
        {links.length ? (
          links.map((c) => (
            <Pressable key={c.label} style={styles.row} onPress={() => Linking.openURL(c.url)}>
              <View style={styles.icon}>
                <Icon name={c.icon} size={20} color="#fff" />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500" }}>{c.label}</Text>
              <Icon name="chevron-left" size={20} />
            </Pressable>
          ))
        ) : (
          <Text style={{ color: COLORS.muted, textAlign: "center" }}>لم تتم إضافة وسائل التواصل بعد.</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bubble: { backgroundColor: "#fff", borderRadius: 16, borderTopStartRadius: 4, padding: 16, ...SHADOW, shadowOpacity: 0.05 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 14, padding: 14, ...SHADOW, shadowOpacity: 0.05 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
})
