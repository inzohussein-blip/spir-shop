import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { onNearEnd } from "../../lib/feed"
import { BlockProps, str } from "../types"

const PAGE = 20

/**
 * Endless two-column product feed ("For you"): loads the next page while the
 * customer scrolls (the screen signals the end through lib/feed).
 */
export function ProductFeed({ props }: BlockProps) {
  const [items, setItems] = useState<Product[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const busy = useRef(false)

  const loadMore = useCallback(async () => {
    if (busy.current || done) return
    busy.current = true
    setLoading(true)
    try {
      const page = await listProducts({ limit: PAGE, offset: items.length, order: "-created_at" })
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...page.filter((p) => !seen.has(p.id))]
      })
      if (page.length < PAGE) setDone(true)
    } catch {
      setDone(true)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }, [done, items.length])

  useEffect(() => {
    if (!items.length && !done) loadMore()
  }, [items.length, done, loadMore])

  useEffect(() => onNearEnd(loadMore), [loadMore])

  const rows: Product[][] = []
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2))
  const title = str(props.title, "مقترحة لكِ")

  return (
    <View style={{ gap: 10 }}>
      {title ? (
        <View style={styles.head}>
          <View style={styles.line} />
          <Text style={styles.title}>{title}</Text>
          <View style={styles.line} />
        </View>
      ) : null}
      <View style={{ marginHorizontal: -16 }} testID="product-feed">
        {rows.map((row) => (
          <View key={row[0].id} style={{ flexDirection: "row", paddingHorizontal: 8 }}>
            {row.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {row.length === 1 ? <View style={{ flex: 1, margin: 4 }} /> : null}
          </View>
        ))}
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
      {done && items.length ? <Text style={styles.end}>شاهدتِ كل المنتجات ✨</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  title: { fontSize: 17, fontWeight: "700" },
  end: { textAlign: "center", color: COLORS.muted, fontSize: 12, marginVertical: 18 },
})
