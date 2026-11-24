import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useRouter } from "expo-router"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import Header from "../../components/Header"
import Text from "../../components/Text"
import { COLORS, IS_NATURAL, SHADOW } from "../../lib/config"
import { useStore } from "../../lib/store"

export const labelIcon = (label: string) => (/عمل|دوام|مكتب/.test(label) ? "office-building-outline" : /بيت|منزل/.test(label) ? "home-outline" : "map-marker-outline")

/** Delivery address (design: "address"): saved addresses with a radio, Edit, and "Add new address". */
export default function AddressesScreen() {
  const router = useRouter()
  const { addresses, address, selectAddress } = useStore()

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageAlt }}>
      <Header title="عنوان التوصيل" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, gap: 26 }}>
        {addresses.length ? (
          addresses.map((a) => {
            const on = a.id === address?.id
            return (
              <Pressable key={a.id} style={styles.card} onPress={() => selectAddress(a.id)} testID={`address-${a.id}`}>
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                <MaterialCommunityIcons name={labelIcon(a.label) as never} size={34} color="#3a3a4a" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.small}>التوصيل إلى</Text>
                  <Text style={styles.label}>{a.label}</Text>
                  <Text style={styles.line} numberOfLines={2}>
                    {`${a.province}، ${a.city} - ${a.address}`}
                  </Text>
                </View>
                <Pressable onPress={() => router.push({ pathname: "/address/edit", params: { id: a.id } })} hitSlop={10} testID={`edit-address-${a.id}`}>
                  <Text style={styles.edit}>تعديل</Text>
                </Pressable>
              </Pressable>
            )
          })
        ) : (
          <Text style={{ textAlign: "center", color: COLORS.muted, marginTop: 30 }}>ما عندك عناوين محفوظة بعد</Text>
        )}
        <Pressable style={styles.add} onPress={() => router.push("/address/edit")} testID="add-address">
          <Text style={styles.addText}>إضافة عنوان جديد</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, ...SHADOW, shadowOpacity: 0.06 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: IS_NATURAL ? COLORS.accent : "#000", alignItems: "center", justifyContent: "center", marginTop: 10 },
  radioOn: {},
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: IS_NATURAL ? COLORS.accent : "#000" },
  small: { fontSize: 11, color: "#5a5a6a" },
  label: { fontSize: 15, fontWeight: "500" },
  line: { fontSize: 12, color: "#a0a0b0", marginTop: 8 },
  edit: { fontSize: 12, color: "#ff5a5a", textDecorationLine: "underline" },
  add: { alignSelf: "center", backgroundColor: COLORS.primary, height: 48, borderRadius: 24, paddingHorizontal: 32, alignItems: "center", justifyContent: "center", marginTop: 60 },
  addText: { color: COLORS.onPrimary, fontSize: 16, fontWeight: "700" },
})
