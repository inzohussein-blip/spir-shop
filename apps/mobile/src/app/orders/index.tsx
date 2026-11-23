import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { AppOrder, getOrders } from "../../lib/api"
import { COLORS, RADIUS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { STATUS_LABEL } from "../../lib/order-labels"
import { useStore } from "../../lib/store"

type Tab = "active" | "delivered" | "canceled"
const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "قيد التنفيذ" },
  { key: "delivered", label: "تم التسليم" },
  { key: "canceled", label: "ملغي" },
]


const tabOf = (o: AppOrder): Tab => (o.current === "canceled" ? "canceled" : o.current === "delivered" ? "delivered" : "active")

/** Orders placed from this device, with status tabs. */
export default function OrdersScreen() {
  const router = useRouter()
  const { orderIds } = useStore()
  const [orders, setOrders] = useState<AppOrder[] | null>(null)
  const [tab, setTab] = useState<Tab>("active")
  const [refreshing, setRefreshing] = useState(false)

  const load = () => getOrders(orderIds).then(setOrders).catch(() => setOrders([]))
  useEffect(() => {
    load()
  }, [orderIds]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!orders) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
  if (!orders.length) {
    return (
      <View style={styles.empty}>
        <Icon name="package" size={44} color={COLORS.muted} />
        <Text style={{ fontSize: 18, fontWeight: "700" }}>ما عندك طلبات بعد</Text>
        <Button label="تسوّقي الآن" onPress={() => router.replace("/")} style={{ alignSelf: "stretch", marginTop: 10 }} />
      </View>
    )
  }

  const shown = orders.filter((o) => tabOf(o) === tab)
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabOn]} testID={`orders-tab-${t.key}`}>
            <Text style={[styles.tabText, tab === t.key && { color: "#fff" }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
          />
        }
        ListEmptyComponent={<Text style={{ textAlign: "center", color: COLORS.muted, marginTop: 30 }}>لا توجد طلبات هنا</Text>}
        renderItem={({ item: o }) => {
          const st = STATUS_LABEL[o.current]
          const qty = o.items.reduce((n, i) => n + i.quantity, 0)
          return (
            <View style={styles.card} testID="order-card">
              <View style={styles.cardTop}>
                <Text style={styles.orderNo}>طلب #{o.display_id}</Text>
                <Text style={styles.date}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  الكمية: <Text style={styles.metaVal}>{qty}</Text>
                </Text>
                <Text style={styles.metaText}>
                  المجموع: <Text style={styles.metaVal}>{formatIqd(o.total)}</Text>
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={[styles.status, { color: st.color }]}>{st.text}</Text>
                <Pressable style={styles.details} onPress={() => router.push(`/orders/${o.id}`)} testID={`order-details-${o.display_id}`}>
                  <Text style={{ fontSize: 13, fontWeight: "500" }}>التفاصيل</Text>
                </Pressable>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32, backgroundColor: COLORS.bg },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabOn: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "500" },
  card: { backgroundColor: "#fff", borderRadius: RADIUS.card - 4, padding: 16, gap: 10, ...SHADOW, borderWidth: 0.5, borderColor: "#f3f3f3" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 12, color: COLORS.muted },
  meta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 13, color: COLORS.muted },
  metaVal: { color: COLORS.text, fontWeight: "700" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  status: { fontSize: 13, fontWeight: "700" },
  details: { borderWidth: 1, borderColor: COLORS.text, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 6 },
})
