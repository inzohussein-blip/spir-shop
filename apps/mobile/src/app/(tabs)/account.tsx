import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Icon, { IconName } from "../../components/Icon"
import Text from "../../components/Text"
import { COLORS, RADIUS, SHADOW } from "../../lib/config"
import { useStore } from "../../lib/store"

/** Account (no sign-up needed): orders, address, wishlist, notifications, contact. */
export default function AccountScreen() {
  const router = useRouter()
  const { address, orderIds, wishlist, settings } = useStore()
  const name = address ? `${address.firstName} ${address.lastName}`.trim() : "أهلاً بك"
  const initial = address?.firstName?.trim()?.[0] ?? "S"

  const rows: { icon: IconName; label: string; hint?: string; onPress: () => void; testID?: string }[] = [
    { icon: "package", label: "طلباتي", hint: orderIds.length ? String(orderIds.length) : undefined, onPress: () => router.push("/orders"), testID: "account-orders" },
    { icon: "map-pin", label: "عنوان التوصيل", hint: address?.province, onPress: () => router.push("/address"), testID: "account-address" },
    { icon: "heart", label: "المفضلة", hint: wishlist.length ? String(wishlist.length) : undefined, onPress: () => router.push("/wishlist") },
    { icon: "bell", label: "الإشعارات", onPress: () => router.push("/notifications") },
  ]

  const contact: { icon: IconName; label: string; url: string }[] = [
    settings.whatsapp_number ? { icon: "message-circle", label: "واتساب", url: `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}` } : null,
    settings.telegram_username ? { icon: "send", label: "تلكرام", url: `https://t.me/${settings.telegram_username.replace(/^@/, "")}` } : null,
    settings.support_phone ? { icon: "phone", label: "اتصال", url: `tel:${settings.support_phone}` } : null,
  ].filter((x): x is { icon: IconName; label: string; url: string } => !!x)

  return (
    <ScrollView style={{ backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>{address?.phone || "بدون حساب: بياناتك محفوظة على جهازك"}</Text>
        </View>
        <Pressable onPress={() => router.push("/server")} hitSlop={10} accessibilityLabel="الإعدادات">
          <Icon name="settings" size={20} color={COLORS.muted} />
        </Pressable>
      </View>

      <View style={styles.card}>
        {rows.map((r, i) => (
          <Pressable key={r.label} style={[styles.row, i === rows.length - 1 && { borderBottomWidth: 0 }]} onPress={r.onPress} testID={r.testID}>
            <Icon name={r.icon} size={20} color={COLORS.muted} />
            <Text style={styles.rowText}>{r.label}</Text>
            {r.hint ? <Text style={styles.hint}>{r.hint}</Text> : null}
            <Icon name="chevron-left" size={18} color={COLORS.muted} />
          </Pressable>
        ))}
      </View>

      {contact.length ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.section}>تواصلي معنا</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {contact.map((c) => (
              <Pressable key={c.label} style={styles.contact} onPress={() => Linking.openURL(c.url)}>
                <Icon name={c.icon} size={20} color={COLORS.accent} />
                <Text style={{ fontSize: 13, fontWeight: "700" }}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.version}>Spir Shop {Constants.expoConfig?.version ?? ""}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 8 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "700" },
  sub: { fontSize: 12, color: COLORS.muted },
  card: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.card,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: "#f3f3f3",
    ...SHADOW,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: "#f3f3f3" },
  rowText: { flex: 1, fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, color: COLORS.muted },
  section: { fontSize: 16, fontWeight: "700" },
  contact: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  version: { textAlign: "center", color: "#c4c4c4", fontSize: 12, marginTop: 10 },
})
