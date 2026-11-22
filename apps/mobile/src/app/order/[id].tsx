import { useLocalSearchParams, useRouter } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"

export default function OrderPlaced() {
  const { n, total } = useLocalSearchParams<{ id: string; n?: string; total?: string }>()
  const router = useRouter()
  return (
    <View style={styles.wrap}>
      <Text style={{ fontSize: 56 }}>✅</Text>
      <Text style={styles.title}>شكراً لك! تم استلام طلبك</Text>
      {n ? <Text style={styles.sub}>رقم الطلب: #{n}</Text> : null}
      {total ? <Text style={styles.sub}>المبلغ عند الاستلام: {formatIqd(Number(total))}</Text> : null}
      <Text style={styles.note}>سيتواصل معك فريقنا على رقم هاتفك لتأكيد الطلب قبل التوصيل.</Text>
      <Pressable style={styles.primary} onPress={() => router.replace("/")}>
        <Text style={styles.primaryText}>متابعة التسوق</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.primaryDark, textAlign: "center" },
  sub: { fontSize: 16, textAlign: "center" },
  note: { color: COLORS.muted, textAlign: "center", lineHeight: 22 },
  primary: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 12 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
