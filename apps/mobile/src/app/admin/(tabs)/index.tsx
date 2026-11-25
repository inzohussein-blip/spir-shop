import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import Icon, { IconName } from "../../../components/Icon"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, ErrorBox, StatusPill } from "../../../components/admin/ui"
import { adminFetch, OrdersResponse, OrderStatus, STATUS_COLORS, STATUS_LABELS, useAdmin } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { formatIqd, timeAgo } from "../../../lib/format"

const ORDER: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"]

function Shortcut({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.8 }]}>
      <View style={styles.shortcutIcon}>
        <Icon name={icon} size={22} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { tenant } = useAdmin()
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      setData(await adminFetch<OrdersResponse>("/admin/app-orders"))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  // refresh every time the tab is opened
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const s = data?.summary
  const latest = data?.orders.slice(0, 5) ?? []

  return (
    <View style={adminStyles.page}>
      <AdminHeader title={tenant?.name ?? "المتجر"} />
      <ScrollView
        contentContainerStyle={adminStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
      >
        {error ? <ErrorBox message={error} onRetry={load} /> : null}

        <View style={styles.row}>
          <Card style={styles.stat}>
            <Text style={adminStyles.muted}>طلبات اليوم</Text>
            <Text style={styles.big} testID="today-orders">{s ? s.today_orders : "—"}</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={adminStyles.muted}>مبيعات اليوم</Text>
            <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>
              {s ? formatIqd(s.today_total) : "—"}
            </Text>
          </Card>
        </View>

        <Card>
          <Text style={[adminStyles.title, { marginBottom: 10 }]}>حالة الطلبات</Text>
          <View style={styles.statuses}>
            {ORDER.map((st) => (
              <Pressable key={st} onPress={() => router.push({ pathname: "/admin/orders", params: { status: st } })} style={[styles.status, { backgroundColor: STATUS_COLORS[st].bg }]}>
                <Text style={[styles.statusNum, { color: STATUS_COLORS[st].fg }]}>{s?.counts[st] ?? 0}</Text>
                <Text style={{ fontSize: 12, color: STATUS_COLORS[st].fg }}>{STATUS_LABELS[st]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <View style={styles.row}>
          <Shortcut icon="plus-circle" label="منتج جديد" onPress={() => router.push("/admin/product/new")} />
          <Shortcut icon="image" label="إعلان جديد" onPress={() => router.push("/admin/ads")} />
          <Shortcut icon="bell" label="إرسال إشعار" onPress={() => router.push("/admin/more")} />
        </View>

        <View style={[adminStyles.rowBetween, { marginTop: 4 }]}>
          <Text style={adminStyles.title}>آخر الطلبات</Text>
          <Pressable onPress={() => router.push("/admin/orders")} hitSlop={8}>
            <Text style={{ color: COLORS.muted }}>عرض الكل</Text>
          </Pressable>
        </View>
        {latest.length === 0 && data ? <Text style={adminStyles.muted}>ما وصلت طلبات بعد.</Text> : null}
        {latest.map((o) => (
          <Card key={o.id} onPress={() => router.push(`/admin/order/${o.id}`)}>
            <View style={adminStyles.rowBetween}>
              <Text style={{ fontWeight: "700" }}>
                #{o.display_id} · {[o.shipping_address?.first_name, o.shipping_address?.last_name].filter(Boolean).join(" ")}
              </Text>
              <StatusPill status={o.current} />
            </View>
            <View style={[adminStyles.rowBetween, { marginTop: 6 }]}>
              <Text style={adminStyles.muted}>
                {o.shipping_address?.province ?? ""} · {timeAgo(o.created_at)}
              </Text>
              <Text style={{ fontWeight: "700" }}>{formatIqd(o.total)}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, gap: 6 },
  big: { fontSize: 24, fontWeight: "700" },
  statuses: { flexDirection: "row", gap: 8 },
  status: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 2 },
  statusNum: { fontSize: 20, fontWeight: "700" },
  shortcut: { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", gap: 8 },
  shortcutIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
})
