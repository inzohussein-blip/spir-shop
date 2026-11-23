import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Header from "../../components/Header"
import Steps from "../../components/Steps"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"

/** "Order completed" (checkout step 3 in the design). */
export default function OrderPlaced() {
  const { id, n, total } = useLocalSearchParams<{ id: string; n?: string; total?: string }>()
  const router = useRouter()
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header title="إتمام الطلب" onBack={() => router.replace("/")} />
      <View style={styles.wrap}>
        <Steps step={3} />
        <Text style={styles.title}>تم الطلب بنجاح</Text>
        <View style={styles.center}>
          <View style={{ marginBottom: 34 }}>
            <MaterialCommunityIcons name="shopping-outline" size={110} color="#2b2b2b" />
            <View style={styles.check}>
              <MaterialCommunityIcons name="check" size={30} color="#2b2b2b" />
            </View>
          </View>
          <Text style={styles.body}>
            {`شكراً لتسوّقك من Spir Shop${n ? `، رقم طلبك ${n}` : ""}.`}
            {total ? `\nالمبلغ عند الاستلام: ${formatIqd(Number(total))}` : ""}
          </Text>
          <Text style={styles.body}>
            {"تقدرين تتابعين طلبك من قسم "}
            <Text style={[styles.body, styles.link]} onPress={() => router.replace(`/orders/${id}`)} testID="track-order">
              «طلباتي»
            </Text>
          </Text>
        </View>
        <Button label="متابعة التسوق" onPress={() => router.replace("/")} testID="continue-shopping" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 30, paddingBottom: 60, gap: 26 },
  title: { fontSize: 26, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  check: {
    position: "absolute",
    bottom: -6,
    end: -22,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: "#2b2b2b",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { fontSize: 14, textAlign: "center", lineHeight: 24, color: "#3a3a3a" },
  link: { fontWeight: "700", textDecorationLine: "underline" },
})
