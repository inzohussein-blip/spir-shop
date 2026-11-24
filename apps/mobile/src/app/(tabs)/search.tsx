import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from "react-native"
import Header from "../../components/Header"
import SearchBar from "../../components/SearchBar"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { Brand, Category, countProducts, listAllCategories, listBrands, listProducts } from "../../lib/api"
import { COLORS, SHADOW, TAB_SPACE } from "../../lib/config"
import { useStore } from "../../lib/store"

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true)

type Row = { id: string; name: string; href: string; count?: number; indent?: boolean }
type Card = { key: string; title: string; color: string; image?: string; rows: Row[]; href: string }

const FALLBACK_COLORS = ["#a3a798", "#8d8180", "#44535a", "#b9adb0", "#c8b49a"]

/** One coloured category card; tapping it opens the list of sub-categories underneath. */
function DiscoverCard({ card, open, onToggle }: { card: Card; open: boolean; onToggle: () => void }) {
  const router = useRouter()
  return (
    <View>
      <Pressable style={[styles.card, { backgroundColor: card.color }]} onPress={onToggle} testID={`discover-${card.key}`}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {card.title}
        </Text>
        <View style={styles.cardArt}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          {card.image ? <Image source={card.image} style={styles.cardImage} contentFit="cover" /> : null}
        </View>
      </Pressable>
      {open ? (
        <View style={styles.rows}>
          {card.rows.map((r) => (
            <Pressable key={r.id} style={styles.row} onPress={() => router.push(r.href as never)} testID={`discover-row-${r.id}`}>
              <Text style={[styles.rowText, r.indent && { paddingStart: 28, fontSize: 13 }]}>{r.name}</Text>
              {r.count != null ? <Text style={styles.rowCount}>{`${r.count} منتج`}</Text> : null}
              <Icon name="chevron-left" size={16} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** Discover (design: "discover"): search, filter, then a coloured card per category. */
export default function DiscoverScreen() {
  const router = useRouter()
  const showBrands = useStore().features.brands
  const [cards, setCards] = useState<Card[]>([])
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const [cats, brands, sample] = await Promise.all([
        listAllCategories().catch(() => [] as Category[]),
        listBrands().catch(() => [] as Brand[]),
        listProducts({ limit: 20 }).catch(() => []),
      ])
      const tops = cats.filter((c) => !c.parent_category_id)
      const list: Card[] = tops.map((c, i) => {
        const subs = cats.filter((s) => s.parent_category_id === c.id)
        return {
          key: c.id,
          title: c.name,
          color: c.metadata?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
          image: c.metadata?.image_url,
          href: `/category/${c.id}`,
          rows: [
            ...subs.map((s) => ({ id: s.id, name: s.name, href: `/category/${s.id}` })),
            { id: `${c.id}-all`, name: "كل المنتجات", href: `/category/${c.id}` },
          ],
        }
      })
      if (brands.length && showBrands) {
        list.push({
          key: "brands",
          title: "العلامات التجارية",
          color: "#bcaeb0",
          image: sample.find((p) => p.collection && p.thumbnail)?.thumbnail ?? undefined,
          href: "/category/all",
          rows: brands.map((b) => ({ id: b.id, name: b.title, href: `/brand/${b.id}` })),
        })
      }
      setCards(list)
      // "N items" next to every row
      const counted = await Promise.all(
        list.map(async (card) => ({
          ...card,
          rows: await Promise.all(
            card.rows.map(async (r) => {
              const isBrand = card.key === "brands"
              const isAll = r.id.endsWith("-all")
              const count = await countProducts(
                isBrand ? { collectionId: r.id } : { categoryId: isAll ? card.key : r.id }
              ).catch(() => undefined)
              return { ...r, count }
            })
          ),
        }))
      )
      setCards(counted)
    })()
  }, [showBrands])

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title="اكتشفي" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 30 + TAB_SPACE, gap: 18 }}>
        <SearchBar onPress={() => router.push("/find")} onFilter={() => router.push({ pathname: "/category/[id]", params: { id: "all", filter: "1" } })} />
        {cards.map((c) => (
          <DiscoverCard
            key={c.key}
            card={c}
            open={open === c.key}
            onToggle={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
              setOpen(open === c.key ? null : c.key)
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
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
  searchText: { color: "#8a8a8f", fontSize: 14 },
  filterBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.08, elevation: 3 },
  card: { height: 126, borderRadius: 10, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  cardTitle: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700", paddingHorizontal: 22 },
  cardArt: { width: 150, height: "100%", alignItems: "center", justifyContent: "center" },
  ringOuter: { position: "absolute", width: 126, height: 126, borderRadius: 63, backgroundColor: "rgba(255,255,255,0.12)" },
  ringInner: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.14)" },
  cardImage: { width: 84, height: 84, borderRadius: 42 },
  rows: { paddingHorizontal: 18, paddingTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, height: 46, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  rowText: { flex: 1, fontSize: 14 },
  rowCount: { fontSize: 11, color: "#b5b5b9" },
})
