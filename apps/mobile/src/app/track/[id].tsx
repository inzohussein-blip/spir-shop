import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Header from "../../components/Header"
import Text from "../../components/Text"
import { AppOrder, getOrders } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { useStore } from "../../lib/store"
import { shortDate, stepTime, trackingCode } from "../../lib/order-labels"

/** Track order (design: "track order"): newest step first, dotted timeline, rate reminder. */
export default function TrackOrder() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<AppOrder | null | undefined>(undefined)
  const { features } = useStore()

  useEffect(() => {
    getOrders([id])
      .then((o) => setOrder(o[0] ?? null))
      .catch(() => setOrder(null))
  }, [id])

  if (!order)
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header title="تتبّع الطلب" />
        {order === undefined ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : <Text style={{ textAlign: "center", marginTop: 40 }}>الطلب غير موجود</Text>}
      </View>
    )

  const delivered = order.current === "delivered"
  const deliveredAt = order.steps.find((s) => s.key === "delivered")?.at
  const steps = [...order.steps].reverse()
  const item = order.items[0]
  const rate = (stars: number) =>
    item && router.push({ pathname: "/rate", params: { product_id: item.product_id, order_id: order.id, title: item.product_title || item.title, stars: String(stars) } })

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header title="تتبّع الطلب" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 40 }}>
        <Text style={styles.meta}>
          {deliveredAt ? "تم التسليم في " : "تاريخ الطلب "}
          <Text style={styles.metaValue}>{shortDate(deliveredAt ?? order.created_at)}</Text>
        </Text>
        <Text style={[styles.meta, { marginTop: 14 }]}>
          {"رمز التتبع :  "}
          <Text style={[styles.metaValue, { fontSize: 15 }]}>{trackingCode(order.id)}</Text>
        </Text>

        <View style={{ marginTop: 40 }} testID="order-timeline">
          {order.current === "canceled" ? (
            <Text style={{ color: COLORS.danger, fontWeight: "700" }}>تم إلغاء الطلب</Text>
          ) : (
            steps.map((s, i) => {
              const done = !!s.at
              const latest = s.key === order.current
              const last = i === steps.length - 1
              return (
                <View key={s.key} style={{ flexDirection: "row", gap: 14 }}>
                  <View style={{ alignItems: "center", width: 20 }}>
                    <MaterialCommunityIcons
                      name={latest ? "record-circle" : done ? "check-circle" : "circle-outline"}
                      size={20}
                      color={done ? "#2b2b2b" : "#c9c9cc"}
                    />
                    {!last ? (
                      <View style={styles.dotLine}>
                        {[0, 1, 2, 3].map((d) => (
                          <View key={d} style={[styles.dot, !steps[i + 1]?.at && { backgroundColor: "#d5d5d8" }]} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.stepRow}>
                    <Text style={[styles.stepLabel, !done && { color: "#b5b5b9" }]}>{s.label}</Text>
                    <Text style={styles.stepAt}>{s.at ? stepTime(s.at) : ""}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>

        {delivered && item && features.reviews ? (
          <View style={styles.rateCard}>
            <MaterialCommunityIcons name="gesture-tap" size={44} color="#3a3a3a" />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontWeight: "700", fontSize: 14 }}>لا تنسي تقيّمين</Text>
              <Text style={{ fontSize: 11, color: COLORS.muted }}>قيّمي المنتج وساعدي غيرك يختار.</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => rate(n)} hitSlop={4} testID={`track-star-${n}`}>
                    <Text style={{ fontSize: 22, color: "#d5d5d8" }}>★</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: "#8a8a8f" },
  metaValue: { color: COLORS.text, fontSize: 13 },
  dotLine: { gap: 5, paddingVertical: 6 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#2b2b2b" },
  stepRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 1, minHeight: 56 },
  stepLabel: { fontSize: 14 },
  stepAt: { fontSize: 12, color: "#b5b5b9" },
  rateCard: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 50, borderWidth: 1, borderColor: "#f0f0f0", borderRadius: 10, padding: 18 },
})
