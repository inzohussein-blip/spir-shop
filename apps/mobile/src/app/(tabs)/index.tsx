import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { Category, listCategories, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState<string | undefined>()
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cats, prods] = await Promise.all([
        listCategories(),
        listProducts({ categoryId: active, q: q || undefined }),
      ])
      setCategories(cats)
      setProducts(prods)
    } catch {
      setError("تعذّر الاتصال بالمتجر. تأكد من الإنترنت وحاول مرة ثانية.")
    } finally {
      setLoading(false)
    }
  }, [active, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 400 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const header = (
    <View style={{ gap: 14, paddingBottom: 8 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>جمالك يبدأ من العناية</Text>
        <Text style={styles.heroSub}>توصيل لكل المحافظات • الدفع عند الاستلام</Text>
      </View>
      <TextInput
        placeholder="ابحث عن منتج..."
        value={q}
        onChangeText={setQ}
        style={styles.search}
        placeholderTextColor={COLORS.muted}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[{ id: undefined, name: "الكل" }, ...categories].map((c) => (
          <Pressable
            key={c.id ?? "all"}
            onPress={() => setActive(c.id)}
            style={[styles.chip, active === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, active === c.id && { color: "#fff" }]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={2}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListHeaderComponent={header}
      contentContainerStyle={{ padding: 10 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <Text style={styles.empty}>{error ?? "لا توجد منتجات"}</Text>
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: COLORS.soft, borderRadius: 16, padding: 20, gap: 6 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: COLORS.primaryDark },
  heroSub: { color: COLORS.primary },
  search: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    writingDirection: "rtl",
    // on native RTL, "left" means start (right side)
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13 },
  empty: { textAlign: "center", marginTop: 40, color: COLORS.muted },
})
