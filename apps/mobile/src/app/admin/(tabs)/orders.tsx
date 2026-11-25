import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { FlatList, RefreshControl, TextInput, View } from "react-native"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, Empty, ErrorBox, Loading, Segments, StatusPill } from "../../../components/admin/ui"
import { adminFetch, OrdersResponse, OrderStatus, STATUS_LABELS } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { formatIqd, timeAgo } from "../../../lib/format"

type Filter = OrderStatus | "all"
const FILTERS: Filter[] = ["placed", "confirmed", "shipped", "delivered", "canceled", "all"]

export default function Orders() {
  const router = useRouter()
  const params = useLocalSearchParams<{ status?: string }>()
  const [status, setStatus] = useState<Filter>("placed")
  const [q, setQ] = useState("")
  const [data, setData] = useState<OrdersResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // opened from a dashboard counter
  useEffect(() => {
    if (params.status && FILTERS.includes(params.status as Filter)) setStatus(params.status as Filter)
  }, [params.status])

  const load = useCallback(async () => {
    try {
      setError(null)
      const qs = new URLSearchParams()
      if (status !== "all") qs.set("status", status)
      if (q.trim()) qs.set("q", q.trim())
      setData(await adminFetch<OrdersResponse>(`/admin/app-orders?${qs}`))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [status, q])

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(load, q ? 350 : 0)
      return () => clearTimeout(t)
    }, [load, q])
  )

  const counts = data?.summary.counts
  return (
    <View style={adminStyles.page}>
      <AdminHeader title="الطلبات" />
      <View style={{ paddingVertical: 12, gap: 10 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="بحث بالاسم، الهاتف أو رقم الطلب" placeholderTextColor={COLORS.muted} style={adminStyles.search} />
        <Segments
          value={status}
          onChange={setStatus}
          options={FILTERS.map((f) => ({ value: f, label: f === "all" ? "الكل" : STATUS_LABELS[f], count: f === "all" ? undefined : counts?.[f] }))}
        />
      </View>
      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorBox message={error} onRetry={load} />
        </View>
      ) : null}
      {!data && !error ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.orders ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
          ListEmptyComponent={<Empty icon="inbox" text="لا توجد طلبات بهذه الحالة" />}
          renderItem={({ item: o }) => {
            const a = o.shipping_address ?? {}
            const items = (o.items ?? []).reduce((n, i) => n + i.quantity, 0)
            return (
              <Card onPress={() => router.push(`/admin/order/${o.id}`)}>
                <View style={adminStyles.rowBetween}>
                  <Text style={{ fontWeight: "700", fontSize: 15 }}>#{o.display_id}</Text>
                  <StatusPill status={o.current} />
                </View>
                <Text style={{ marginTop: 6, fontWeight: "700" }}>{[a.first_name, a.last_name].filter(Boolean).join(" ") || "—"}</Text>
                <Text style={adminStyles.muted}>
                  {[a.province, a.city].filter(Boolean).join(" - ")} · {a.phone ?? ""}
                </Text>
                <View style={[adminStyles.rowBetween, { marginTop: 8 }]}>
                  <Text style={adminStyles.muted}>
                    {items} قطعة · {timeAgo(o.created_at)}
                  </Text>
                  <Text style={{ fontWeight: "700" }}>{formatIqd(o.total)}</Text>
                </View>
              </Card>
            )
          }}
        />
      )}
    </View>
  )
}
