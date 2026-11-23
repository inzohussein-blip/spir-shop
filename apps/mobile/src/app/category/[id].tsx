import { useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native"
import FilterSheet from "../../components/FilterSheet"
import Header from "../../components/Header"
import Icon from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { getSale, listAllCategories, listBrands, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { applyFilters, countActive, EMPTY_FILTERS, Filters } from "../../lib/filters"
import { useStore } from "../../lib/store"

/**
 * Results (design: "found results"): back · title, "Found N results" with the
 * filter button, then the product grid. Used for categories, search, a brand and the sale.
 */
export default function ResultsScreen() {
  const { id, q, sale, brand, filter } = useLocalSearchParams<{ id: string; q?: string; sale?: string; brand?: string; filter?: string }>()
  const { ratings } = useStore()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [title, setTitle] = useState(sale ? "العروض" : q ? q : "كل المنتجات")
  const [filters, setFilters] = useState<Filters>(sale ? { ...EMPTY_FILTERS, discounts: [10] } : EMPTY_FILTERS)
  const [filterOpen, setFilterOpen] = useState(filter === "1")

  useEffect(() => {
    const categoryId = id && id !== "all" ? id : undefined
    ;(async () => {
      try {
        if (sale) {
          const s = await getSale()
          setProducts(s?.product_ids.length ? await listProducts({ ids: s.product_ids, limit: 50 }) : [])
          return
        }
        setProducts(await listProducts({ categoryId, collectionId: brand || undefined, q: q || undefined }))
      } catch {
        setProducts([])
      }
    })()
    if (categoryId && !q) {
      listAllCategories()
        .then((cats) => {
          const c = cats.find((x) => x.id === categoryId)
          if (c) setTitle(c.name)
        })
        .catch(() => undefined)
    }
    if (brand) {
      listBrands()
        .then((all) => {
          const b = all.find((x) => x.id === brand)
          if (b) setTitle(b.title)
        })
        .catch(() => undefined)
    }
  }, [id, q, sale, brand])

  const shown = useMemo(() => (products ? applyFilters(products, filters, ratings) : []), [products, filters, ratings])
  const active = countActive(filters)

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header title={title} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 30 }}
          ListHeaderComponent={
            <View style={styles.found}>
              <Text style={styles.foundText} testID="results-count">{`تم العثور على\n${shown.length} نتيجة`}</Text>
              <Pressable style={[styles.filterBtn, active > 0 && styles.filterOn]} onPress={() => setFilterOpen(true)} testID="open-filter">
                <Text style={[styles.filterText, active > 0 && { color: "#fff" }]}>{active ? `فلتر (${active})` : "فلتر"}</Text>
                <Icon name="chevron-down" size={16} color={active ? "#fff" : COLORS.text} />
              </Pressable>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 40, color: COLORS.muted }}>لا توجد منتجات مطابقة</Text>}
        />
      )}
      <FilterSheet visible={filterOpen} products={products ?? []} value={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  found: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingTop: 4, paddingBottom: 14 },
  foundText: { fontSize: 22, fontWeight: "700", lineHeight: 30 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#fff" },
  filterOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 14 },
})
