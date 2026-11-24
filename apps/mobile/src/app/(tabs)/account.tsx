import Constants from "expo-constants"
import { useRouter } from "expo-router"
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { IconName } from "../../components/Icon"
import Text from "../../components/Text"
import { COLORS, SHADOW, TAB_SPACE } from "../../lib/config"
import { useStore } from "../../lib/store"

/** Profile (design: "profile"): avatar, name, settings cog, then one card with the account rows. */
export default function AccountScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { address, addresses, orderIds, wishlist, deleteAddress } = useStore()
  const name = address ? `${address.firstName} ${address.lastName}`.trim() : "أهلاً بك"
  const initial = address?.firstName?.trim()?.[0] ?? "S"

  const clearData = () => {
    const go = async () => {
      for (const a of addresses) await deleteAddress(a.id)
    }
    if (Platform.OS === "web") return go()
    Alert.alert("مسح بياناتي", "راح ننسى اسمك وعناوينك على هذا الجهاز. طلباتك تبقى محفوظة بالمتجر.", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح", style: "destructive", onPress: go },
    ])
  }

  const rows: { icon: IconName; label: string; hint?: string; onPress: () => void; testID?: string }[] = [
    { icon: "map-pin", label: "عنوان التوصيل", hint: address?.label, onPress: () => router.push("/address"), testID: "account-address" },
    { icon: "package", label: "طلباتي", hint: orderIds.length ? String(orderIds.length) : undefined, onPress: () => router.push("/orders"), testID: "account-orders" },
    { icon: "credit-card", label: "طريقة الدفع", hint: "عند الاستلام", onPress: () => router.push("/about") },
    { icon: "heart", label: "المفضلة", hint: wishlist.length ? String(wishlist.length) : undefined, onPress: () => router.push("/wishlist"), testID: "account-wishlist" },
    { icon: "star", label: "قيّمي التطبيق", onPress: () => router.push("/feedback"), testID: "account-feedback" },
    { icon: "log-out", label: "مسح بياناتي من الجهاز", onPress: clearData },
  ]

  return (
    <ScrollView style={{ backgroundColor: COLORS.bg }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: insets.top + 50, paddingBottom: 30 + TAB_SPACE, gap: 40 }}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>{address?.phone || "بياناتك محفوظة على جهازك"}</Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10} accessibilityLabel="الإعدادات" testID="open-settings">
          <Icon name="settings" size={22} color={COLORS.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.card}>
        {rows.map((r, i) => (
          <Pressable key={r.label} style={[styles.row, i === rows.length - 1 && { borderBottomWidth: 0 }]} onPress={r.onPress} testID={r.testID}>
            <Icon name={r.icon} size={19} color="#a7a9b7" />
            <Text style={styles.rowText}>{r.label}</Text>
            {r.hint ? <Text style={styles.hint}>{r.hint}</Text> : null}
            <Icon name="chevron-left" size={20} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.version}>Spir Shop {Constants.expoConfig?.version ?? ""}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#f2a1a1", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 17, fontWeight: "700" },
  sub: { fontSize: 12, color: COLORS.text, textAlign: "left" },
  card: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 10, borderWidth: 1, borderColor: "#f2f2f2", ...SHADOW, shadowOpacity: 0.08, elevation: 3 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, height: 70, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#f2f2f2" },
  rowText: { flex: 1, fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 12, color: COLORS.muted },
  version: { textAlign: "center", fontSize: 11, color: "#c4c4c4" },
})
