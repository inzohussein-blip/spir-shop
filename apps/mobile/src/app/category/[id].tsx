import { Stack, useLocalSearchParams } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import { lowestPrice } from "../../components/ProductCard"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { Brand, getSale, listBrands, listCategories, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { saleInfo, useStore } from "../../lib/store"

type Sort = "new" | "price_asc" | "price_desc" | "rating"
const SORTS: { key: Sort; label: string }[] = [
  { key: "new", label: "الأحدث" },
  { key: "price_asc", label: "السعر: الأقل" },
  { key: "price_desc", label: "السعر: الأعلى" },
  { key: "rating", label: "الأعلى تقييماً" },
]
const PRICE_RANGES = [
  { label: "الكل", min: 0, max: Infinity },
  { label: "أقل من 10,000", min: 0, max: 10000 },
  { label: "10,000 - 25,000", min: 10000, max: 25000 },
  { label: "أكثر من 25,000", min: 25000, max: Infinity },
]

/** Product list for a category, a search or the sale, with sort and filters. */
export default function CategoryScreen() {
  const { id, q, sale } = useLocalSearchParams<{ id: string; q?: string; sale?: string }>()
  const { ratings } = useStore()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [title, setTitle] = useState(sale ? "العروض" : q ? `نتائج: ${q}` : "كل المنتجات")
  const [sort, setSort] = useState<Sort>("new")
  const [brandId, setBrandId] = useState<string | null>(null)
  const [onlySale, setOnlySale] = useState(!!sale)
  const [range, setRange] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    const categoryId = id && id !== "all" ? id : undefined
    listBrands().then(setBrands).catch(() => undefined)
    ;(async () => {
      try {
        if (sale) {
          const s = await getSale()
          setProducts(s?.product_ids.length ? await listProducts({ ids: s.product_ids, limit: 50 }) : [])
          return
        }
        setProducts(await listProducts({ categoryId, q: q || undefined }))
      } catch {
        setProducts([])
      }
    })()
    if (categoryId && !q) {
      listCategories()
        .then((cats) => {
          const c = cats.find((x) => x.id === categoryId)
          if (c) setTitle(c.name)
        })
        .catch(() => undefined)
    }
  }, [id, q, sale])

  const shown = useMemo(() => {
    if (!products) return []
    const priceOf = (p: Product) => saleInfo(p)?.price ?? lowestPrice(p) ?? 0
    const r = PRICE_RANGES[range]
    let list = products.filter(
      (p) =>
        (!brandId || p.collection?.id === brandId) &&
        (!onlySale || !!saleInfo(p)) &&
        priceOf(p) >= r.min &&
        priceOf(p) < r.max
    )
    if (sort === "price_asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b))
    if (sort === "price_desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a))
    if (sort === "rating") list = [...list].sort((a, b) => (ratings[b.id]?.average ?? 0) - (ratings[a.id]?.average ?? 0))
    return list
  }, [products, sort, brandId, onlySale, range, ratings])

  const activeFilters = (brandId ? 1 : 0) + (onlySale ? 1 : 0) + (range ? 1 : 0)

  return (
    <>
      <Stack.Screen options={{ title }} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ backgroundColor: COLORS.bg }}
          data={shown}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: 11 }}
          ListHeaderComponent={
            <View style={styles.toolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable style={[styles.chip, activeFilters > 0 && styles.chipOn]} onPress={() => setFilterOpen(true)} testID="open-filter">
                  <Icon name="sliders" size={14} color={activeFilters ? "#fff" : COLORS.text} />
                  <Text style={[styles.chipText, activeFilters > 0 && { color: "#fff" }]}>
                    {activeFilters ? `فلتر (${activeFilters})` : "فلتر"}
                  </Text>
                </Pressable>
                {SORTS.map((s) => (
                  <Pressable key={s.key} style={[styles.chip, sort === s.key && styles.chipOn]} onPress={() => setSort(s.key)} testID={`sort-${s.key}`}>
                    <Text style={[styles.chipText, sort === s.key && { color: "#fff" }]}>{s.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.count}>{shown.length} منتج</Text>
            </View>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 40, color: COLORS.muted }}>لا توجد منتجات مطابقة</Text>}
        />
      )}

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHead}>
              <Text style={{ fontSize: 20, fontWeight: "700" }}>فلتر</Text>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={10}>
                <Icon name="x" size={22} />
              </Pressable>
            </View>

            <Text style={styles.label}>السعر</Text>
            <View style={styles.wrap}>
              {PRICE_RANGES.map((r, i) => (
                <Pressable key={r.label} style={[styles.pill, range === i && styles.pillOn]} onPress={() => setRange(i)}>
                  <Text style={[styles.pillText, range === i && { color: "#fff" }]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>العلامة التجارية</Text>
            <View style={styles.wrap}>
              <Pressable style={[styles.pill, !brandId && styles.pillOn]} onPress={() => setBrandId(null)}>
                <Text style={[styles.pillText, !brandId && { color: "#fff" }]}>الكل</Text>
              </Pressable>
              {brands.map((b) => (
                <Pressable key={b.id} style={[styles.pill, brandId === b.id && styles.pillOn]} onPress={() => setBrandId(b.id)} testID={`filter-brand-${b.handle}`}>
                  <Text style={[styles.pillText, brandId === b.id && { color: "#fff" }]}>{b.title}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>الخصومات</Text>
            <View style={styles.wrap}>
              <Pressable style={[styles.pill, onlySale && styles.pillOn]} onPress={() => setOnlySale(!onlySale)} testID="filter-sale">
                <Text style={[styles.pillText, onlySale && { color: "#fff" }]}>العروض فقط</Text>
              </Pressable>
            </View>

            <View style={styles.sheetFoot}>
              <Pressable
                onPress={() => {
                  setBrandId(null)
                  setOnlySale(false)
                  setRange(0)
                }}
              >
                <Text style={{ fontSize: 15 }}>إعادة ضبط</Text>
              </Pressable>
              <View style={{ width: 150 }}>
                <Button label="تطبيق" onPress={() => setFilterOpen(false)} testID="apply-filter" />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  toolbar: { gap: 8, paddingHorizontal: 4, paddingBottom: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 12, height: 34 },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13 },
  count: { fontSize: 12, color: COLORS.muted },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, gap: 12 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  label: { fontSize: 15, fontWeight: "700", marginTop: 6 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderWidth: 1, borderColor: COLORS.text, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  pillOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 13 },
  sheetFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
})
