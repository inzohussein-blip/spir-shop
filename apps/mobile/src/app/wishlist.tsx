import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Button from "../components/Button"
import Header from "../components/Header"
import Icon, { CategoryIcon, HeartIcon } from "../components/Icon"
import ProductCard from "../components/ProductCard"
import Text from "../components/Text"
import { listProducts, Product } from "../lib/api"
import { COLORS } from "../lib/config"
import { useStore } from "../lib/store"

type Board = { key: string; title: string; products: Product[] }

/** Black-bordered two-way switch from the design ("All items" | "Boards"). */
function Segment({ value, onChange }: { value: "all" | "boards"; onChange: (v: "all" | "boards") => void }) {
  return (
    <View style={styles.segment}>
      {(
        [
          ["all", "كل المنتجات"],
          ["boards", "المجموعات"],
        ] as const
      ).map(([k, label]) => (
        <Pressable key={k} onPress={() => onChange(k)} style={[styles.segBtn, value === k && styles.segActive]} testID={`wish-tab-${k}`}>
          <Text style={[styles.segText, value === k && { color: "#fff" }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

/** Board cover: two big photos and a 2×2 grid of small ones. */
function Collage({ products }: { products: Product[] }) {
  const img = (i: number, style: object) => {
    const p = products[i]
    return (
      <View style={[styles.tile, style]}>
        {p?.thumbnail ? <Image source={p.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : p ? <CategoryIcon name={p.categories?.[0]?.name ?? ""} color={COLORS.muted} /> : null}
      </View>
    )
  }
  return (
    <View style={styles.collage}>
      {img(0, { flex: 1.25 })}
      {img(1, { flex: 1.25 })}
      <View style={{ flex: 1, gap: 4 }}>
        {img(2, { flex: 1 })}
        {img(3, { flex: 1 })}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        {img(4, { flex: 1 })}
        {img(5, { flex: 1 })}
      </View>
    </View>
  )
}

/** My wishlist (design: "my wishlist - all items / boards"). Boards group saved products by category. */
export default function WishlistScreen() {
  const router = useRouter()
  const { wishlist } = useStore()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [tab, setTab] = useState<"all" | "boards">("all")
  const [board, setBoard] = useState<string | null>(null)

  useEffect(() => {
    if (!wishlist.length) {
      setProducts([])
      return
    }
    listProducts({ ids: wishlist, limit: 100 })
      .then((list) => setProducts(wishlist.map((id) => list.find((p) => p.id === id)).filter((p): p is Product => !!p)))
      .catch(() => setProducts([]))
  }, [wishlist])

  const boards = useMemo<Board[]>(() => {
    const map = new Map<string, Board>()
    for (const p of products ?? []) {
      const c = p.categories?.find((x) => x) ?? { id: "other", name: "أخرى" }
      const b = map.get(c.id) ?? { key: c.id, title: c.name, products: [] }
      b.products.push(p)
      map.set(c.id, b)
    }
    return [...map.values()]
  }, [products])

  const open = boards.find((b) => b.key === board)
  const grid = open ? open.products : products ?? []

  let body
  if (!products) body = <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
  else if (!products.length)
    body = (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <HeartIcon filled={false} size={40} />
        </View>
        <Text style={styles.emptyTitle}>المفضلة فارغة</Text>
        <Text style={styles.emptyText}>اضغطي ♡ على أي منتج حتى تحفظيه هنا</Text>
        <Button label="تصفّحي المنتجات" onPress={() => router.push("/")} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    )
  else if (tab === "boards" && !open)
    body = (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, gap: 26 }}>
        {boards.map((b) => (
          <Pressable key={b.key} onPress={() => setBoard(b.key)} testID={`board-${b.key}`}>
            <Collage products={b.products} />
            <View style={styles.boardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.boardTitle}>{b.title}</Text>
                <Text style={styles.boardCount}>{`${b.products.length} منتج`}</Text>
              </View>
              <Icon name="chevron-left" size={22} color="#b5b5b9" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    )
  else
    body = (
      <FlatList
        data={grid}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 30 }}
        ListHeaderComponent={
          open ? (
            <Pressable onPress={() => setBoard(null)} style={styles.boardBack}>
              <Icon name="chevron-right" size={18} />
              <Text style={{ fontWeight: "700" }}>{open.title}</Text>
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    )

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title="المفضلة" />
      <Segment
        value={tab}
        onChange={(v) => {
          setTab(v)
          setBoard(null)
        }}
      />
      {body}
    </View>
  )
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", marginHorizontal: 34, marginBottom: 18, borderWidth: 1.2, borderColor: "#000" },
  segBtn: { flex: 1, height: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  segActive: { backgroundColor: "#000" },
  segText: { fontSize: 15, fontWeight: "700", color: "#000" },
  collage: { flexDirection: "row", gap: 4, height: 128, borderRadius: 10, overflow: "hidden" },
  tile: { backgroundColor: "#f3f3f3", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  boardRow: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#ececec" },
  boardTitle: { fontSize: 20, fontWeight: "700" },
  boardCount: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  boardBack: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingBottom: 6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.muted },
})
