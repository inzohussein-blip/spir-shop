import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BackButton } from "../components/Header"
import Icon from "../components/Icon"
import ProductCard from "../components/ProductCard"
import Text from "../components/Text"
import { listProducts, Product } from "../lib/api"
import { COLORS, FONTS, IS_NATURAL, SHADOW } from "../lib/config"
import { addRecentSearch, getRecentSearches, saveRecentSearches } from "../lib/filters"

/** Popular search terms shown before typing (demo list; edit to match the store's best sellers). */
const TRENDING = ["سيروم", "واقي شمس", "عطر", "أحمر شفاه", "ماسكارا", "مرطب", "كريم أساس", "ماسك شعر"]

/** Search (design: "search"): back, search field + filter, recent searches, popular this week. */
export default function FindScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState("")
  const [recent, setRecent] = useState<string[]>([])
  const [popular, setPopular] = useState<Product[]>([])

  useEffect(() => {
    getRecentSearches().then(setRecent)
    listProducts({ limit: 4 }).then(setPopular).catch(() => undefined)
  }, [])

  const search = async (text: string) => {
    const t = text.trim()
    if (!t) return
    await addRecentSearch(t)
    setRecent(await getRecentSearches())
    router.push({ pathname: "/category/[id]", params: { id: "all", q: t } })
  }
  const remove = (t: string) => {
    const next = recent.filter((x) => x !== t)
    setRecent(next)
    saveRecentSearches(next)
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 22, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Icon name="search" size={19} color="#8a8a8f" />
            <TextInput
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => search(q)}
              returnKeyType="search"
              autoFocus
              placeholder="ابحثي"
              placeholderTextColor="#8a8a8f"
              style={styles.input}
              testID="search-input"
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => router.push({ pathname: "/category/[id]", params: { id: "all", filter: "1" } })} accessibilityLabel="فلتر">
            <Icon name="sliders" size={19} color="#5a5a5e" />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.recentTitle}>🔥 الأكثر بحثاً</Text>
        </View>
        <View style={styles.chips}>
          {TRENDING.map((t, i) => (
            <Pressable key={t} style={[styles.chip, i < 3 && styles.hot]} onPress={() => search(t)} testID={`trend-${t}`}>
              <Text style={[styles.chipText, i < 3 && { color: COLORS.sale, fontWeight: "700" }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {recent.length ? (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.recentTitle}>عمليات البحث الأخيرة</Text>
              <Pressable
                onPress={() => {
                  setRecent([])
                  saveRecentSearches([])
                }}
                hitSlop={8}
                accessibilityLabel="مسح"
                testID="clear-recent"
              >
                <Icon name="trash-2" size={18} color="#8a8a8f" />
              </Pressable>
            </View>
            <View style={styles.chips}>
              {recent.map((t) => (
                <Pressable key={t} style={styles.chip} onPress={() => search(t)} testID={`recent-${t}`}>
                  <Text style={styles.chipText}>{t}</Text>
                  <Pressable onPress={() => remove(t)} hitSlop={8}>
                    <Icon name="x" size={15} color="#b5b5c9" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={[styles.titleRow, { marginTop: 40 }]}>
          <Text style={styles.popularTitle}>الأكثر رواجاً هذا الأسبوع</Text>
          <Pressable onPress={() => router.push("/category/all")}>
            <Text style={{ color: "#9b9b9b", fontSize: 13 }}>عرض الكل</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}>
          {popular.map((p) => (
            <ProductCard key={p.id} product={p} variant="featured" />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 12 },
  search: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    ...SHADOW,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, textAlign: Platform.OS === "web" ? "right" : "left", height: "100%", ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) },
  filterBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.08, elevation: 3 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 16 },
  recentTitle: { fontSize: 15, color: "#9b9b9b", fontWeight: "500" },
  popularTitle: { fontSize: 20, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 16, height: 38, paddingHorizontal: 18, borderRadius: 10, backgroundColor: IS_NATURAL ? COLORS.card : "#f8f8f8" },
  chipText: { fontSize: 14, color: "#4a4a4e" },
  hot: { backgroundColor: COLORS.saleSoft },
})
