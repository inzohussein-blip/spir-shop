import { Image } from "expo-image"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from "react-native"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, Empty, ErrorBox, Fab, Loading } from "../../../components/admin/ui"
import { adminFetch, AdminProduct } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { formatIqd } from "../../../lib/format"

type Page = { products: AdminProduct[]; count: number }

export default function Products() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [items, setItems] = useState<AdminProduct[] | null>(null)
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const r = await adminFetch<Page>(`/admin/app-products?q=${encodeURIComponent(q.trim())}`)
      setItems(r.products)
      setCount(r.count)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [q])

  const more = async () => {
    if (!items || loadingMore || items.length >= count) return
    setLoadingMore(true)
    try {
      const r = await adminFetch<Page>(`/admin/app-products?q=${encodeURIComponent(q.trim())}&offset=${items.length}`)
      setItems([...items, ...r.products])
    } catch {
      // keep what is shown
    } finally {
      setLoadingMore(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(load, q ? 350 : 0)
      return () => clearTimeout(t)
    }, [load, q])
  )

  return (
    <View style={adminStyles.page}>
      <AdminHeader title={`المنتجات${count ? ` (${count})` : ""}`} />
      <View style={{ paddingVertical: 12 }}>
        <TextInput value={q} onChangeText={setQ} placeholder="بحث عن منتج" placeholderTextColor={COLORS.muted} style={adminStyles.search} />
      </View>
      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorBox message={error} onRetry={load} />
        </View>
      ) : null}
      {!items && !error ? (
        <Loading />
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(p) => p.id}
          onEndReached={more}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
          ListEmptyComponent={<Empty icon="tag" text={q ? "ما في نتائج" : "ما في منتجات بعد. أضف أول منتج من زر +"} />}
          renderItem={({ item: p }) => (
            <Card onPress={() => router.push(`/admin/product/${p.id}`)} style={styles.row}>
              <Image source={p.thumbnail ?? p.images[0] ?? undefined} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: "700" }} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={adminStyles.muted}>
                  {p.price != null ? formatIqd(p.price) : "—"}
                  {p.simple ? "" : ` · ${p.variants.length} أحجام/درجات`}
                </Text>
              </View>
              {p.status !== "published" ? (
                <View style={styles.hidden}>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>مخفي</Text>
                </View>
              ) : null}
            </Card>
          )}
        />
      )}
      <Fab label="منتج جديد" onPress={() => router.push("/admin/product/new")} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: COLORS.soft },
  hidden: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
})
