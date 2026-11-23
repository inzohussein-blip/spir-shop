import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Header from "../../components/Header"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { AppOrder, getOrders } from "../../lib/api"
import { COLORS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { shortDate, STATUS_LABEL, trackingCode } from "../../lib/order-labels"
import { useStore } from "../../lib/store"

type Tab = "active" | "delivered" | "canceled"
const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "قيد التنفيذ" },
  { key: "delivered", label: "تم التسليم" },
  { key: "canceled", label: "ملغي" },
]
const tabOf = (o: AppOrder): Tab => (o.current === "canceled" ? "canceled" : o.current === "delivered" ? "delivered" : "active")

/** My orders (design: "my orders"): status pills, then a card per order with "Details". */
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

  const shown = (orders ?? []).filter((o) => tabOf(o) === tab)

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title="طلباتي" />
      {!orders ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : !orders.length ? (
        <View style={styles.empty}>
          <Icon name="package" size={44} color={COLORS.muted} />
          <Text style={{ fontSize: 18, fontWeight: "700" }}>ما عندك طلبات بعد</Text>
          <Button label="تسوّقي الآن" onPress={() => router.replace("/")} style={{ alignSelf: "stretch", marginTop: 10 }} />
        </View>
      ) : (
        <>
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
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30, gap: 22 }}
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
                  <View style={styles.row}>
                    <Text style={styles.orderNo}>{`طلب #${o.display_id}`}</Text>
                    <Text style={styles.date}>{shortDate(o.created_at)}</Text>
                  </View>
                  <View style={[styles.row, { justifyContent: "flex-start", gap: 8 }]}>
                    <Text style={styles.muted}>رمز التتبع:</Text>
                    <Text style={styles.value}>{trackingCode(o.id)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.muted}>
                      {"الكمية: "}
                      <Text style={styles.value}>{qty}</Text>
                    </Text>
                    <Text style={styles.muted}>
                      {"المجموع: "}
                      <Text style={[styles.value, { fontWeight: "700", fontSize: 15 }]}>{formatIqd(o.total)}</Text>
                    </Text>
                  </View>
                  <View style={[styles.row, { marginTop: 4 }]}>
                    <Text style={[styles.status, { color: st.color }]}>{st.text}</Text>
                    <Pressable style={styles.details} onPress={() => router.push(`/orders/${o.id}`)} testID={`order-details-${o.display_id}`}>
                      <Text style={{ fontSize: 14 }}>التفاصيل</Text>
                    </Pressable>
                  </View>
                </View>
              )
            }}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22, paddingBottom: 18 },
  tab: { height: 30, paddingHorizontal: 18, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: "#454545" },
  tabText: { fontSize: 14, fontWeight: "500" },
  card: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 22, paddingVertical: 18, gap: 10, ...SHADOW, shadowOpacity: 0.1, elevation: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { fontSize: 17, fontWeight: "700" },
  date: { fontSize: 13, color: "#8a8a8f" },
  muted: { fontSize: 13, color: "#8a8a8f" },
  value: { fontSize: 13, color: COLORS.text },
  status: { fontSize: 13, fontWeight: "700" },
  details: { height: 34, paddingHorizontal: 24, borderRadius: 17, borderWidth: 1, borderColor: "#555", alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
})
