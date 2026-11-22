import { useLocalSearchParams, useRouter } from "expo-router"
import { StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import Steps from "../../components/Steps"

/** "Order completed" screen (step 3 of the checkout design). */
export default function OrderPlaced() {
  const { n, total } = useLocalSearchParams<{ id: string; n?: string; total?: string }>()
  const router = useRouter()
  return (
    <View style={styles.wrap}>
      <Steps step={3} />
      <Text style={styles.title}>تم الطلب بنجاح</Text>

      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Icon name="shopping-bag" size={72} />
          <View style={styles.check}>
            <Icon name="check" size={26} />
          </View>
        </View>
        <Text style={styles.body}>شكراً لك! استلمنا طلبك{n ? ` رقم ${n}` : ""}</Text>
        {total ? <Text style={styles.body}>المبلغ عند الاستلام: {formatIqd(Number(total))}</Text> : null}
        <Text style={[styles.body, { color: COLORS.muted }]}>
          سيتواصل معك فريقنا على رقم هاتفك لتأكيد الطلب قبل التوصيل.
        </Text>
      </View>

      <Button label="متابعة التسوق" onPress={() => router.replace("/")} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 20 },
  title: { fontSize: 26, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  iconWrap: { marginBottom: 24 },
  check: {
    position: "absolute",
    bottom: -10,
    end: -18,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: COLORS.text,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { fontSize: 14, textAlign: "center", lineHeight: 22 },
})
