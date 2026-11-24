import { Image } from "expo-image"
import { Link } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { CategoryIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { Category, listAllCategories, listProducts, Product } from "../../lib/api"
import { COLORS, IS_NATURAL } from "../../lib/config"
import { BlockProps, num, str } from "../types"

/** Products for a block: all, a category, or a collection. */
function useBlockProducts(props: Record<string, unknown>) {
  const [products, setProducts] = useState<Product[] | null>(null)
  const source = str(props.source, "all")
  const categoryId = source === "category" ? str(props.category_id) : undefined
  const collectionId = source === "collection" ? str(props.collection_id) : undefined
  const limit = Math.min(Math.max(num(props.limit, 8), 1), 50)

  useEffect(() => {
    let alive = true
    listProducts({ categoryId: categoryId || undefined, collectionId: collectionId || undefined, limit })
      .then((p) => alive && setProducts(p))
      .catch(() => alive && setProducts([]))
    return () => {
      alive = false
    }
  }, [categoryId, collectionId, limit])

  return products
}

const SectionTitle = ({ title, href }: { title: string; href?: string }) =>
  title ? (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      {href ? (
        <Link href={href as never}>
          <Text style={styles.more}>عرض الكل</Text>
        </Link>
      ) : null}
    </View>
  ) : null

const seeAllHref = (props: Record<string, unknown>) =>
  str(props.source) === "category" && str(props.category_id)
    ? `/category/${str(props.category_id)}`
    : "/category/all"

/** Horizontal slider: tall cards ("featured", default) or small side-by-side cards ("compact"). */
export function ProductCarousel({ props }: BlockProps) {
  const products = useBlockProducts(props)
  const compact = str(props.style) === "compact"
  if (products && !products.length) return null
  return (
    <View style={{ gap: 16 }}>
      <SectionTitle title={str(props.title)} href={seeAllHref(props)} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ gap: compact ? 14 : 16, paddingHorizontal: 20, paddingVertical: compact ? 4 : 0 }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} variant={compact ? "compact" : "featured"} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export function ProductGrid({ props }: BlockProps) {
  const products = useBlockProducts(props)
  if (products && !products.length) return null
  const rows: Product[][] = []
  for (let i = 0; i < (products?.length ?? 0); i += 2) rows.push(products!.slice(i, i + 2))
  return (
    <View style={{ gap: 6, marginHorizontal: -8 }}>
      <View style={{ paddingHorizontal: 8 }}>
        <SectionTitle title={str(props.title)} />
      </View>
      {!products ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        rows.map((row) => (
          <View key={row[0].id} style={{ flexDirection: "row" }}>
            {row.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {row.length === 1 ? <View style={{ flex: 1, margin: 6 }} /> : null}
          </View>
        ))
      )}
    </View>
  )
}

/** Row of round category icons with names underneath (top of the home screen in the design). */
export function CategoryChips({ props }: BlockProps) {
  const [cats, setCats] = useState<Category[]>([])
  useEffect(() => {
    listAllCategories()
      .then((all) => setCats(all.filter((c) => !c.parent_category_id)))
      .catch(() => setCats([]))
  }, [])
  if (!cats.length) return null
  if (IS_NATURAL) {
    // natural theme: "Categories / See all" with small white cards (name + photo)
    return (
      <View style={{ gap: 12 }}>
        <SectionTitle title={str(props.title) || "الأقسام"} href="/search" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {cats.map((c) => (
            <Link key={c.id} href={`/category/${c.id}`} asChild>
              <Pressable style={styles.catCard} testID={`category-${c.id}`}>
                <Text style={styles.catCardText} numberOfLines={1}>{c.name}</Text>
                {c.metadata?.image_url ? (
                  <Image source={c.metadata.image_url} style={styles.catCardImg} contentFit="cover" />
                ) : (
                  <CategoryIcon name={c.name} size={20} color={COLORS.accent} />
                )}
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </View>
    )
  }
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle title={str(props.title)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 2, paddingHorizontal: 18 }}>
        {cats.map((c, i) => (
          <Link key={c.id} href={`/category/${c.id}`} asChild>
            <Pressable style={styles.cat} testID={`category-${c.id}`}>
              <View style={[styles.catRing, i === 0 && styles.catRingActive]}>
                <View style={[styles.catCircle, i === 0 && styles.catCircleActive]}>
                  <CategoryIcon name={c.name} size={21} color={i === 0 ? COLORS.onStrong : "#8a8a8f"} />
                </View>
              </View>
              <Text style={[styles.catText, i === 0 && { color: COLORS.primaryDark }]} numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: IS_NATURAL ? 17 : 20, fontWeight: "700", color: COLORS.primaryDark },
  more: { color: COLORS.link, fontSize: 13, fontWeight: IS_NATURAL ? "700" : "400" },
  cat: { alignItems: "center", width: 68, gap: 8 },
  catRing: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  catRingActive: { borderWidth: 1.5, borderColor: COLORS.strong },
  catCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: IS_NATURAL ? COLORS.card : COLORS.soft, alignItems: "center", justifyContent: "center" },
  catCircleActive: { backgroundColor: COLORS.strong },
  catCard: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, borderRadius: 14, backgroundColor: COLORS.card, paddingStart: 14, paddingEnd: 6 },
  catCardText: { fontSize: 13, fontWeight: "700" },
  catCardImg: { width: 38, height: 40, borderRadius: 10 },
  catText: { fontSize: 11, color: "#9b9b9b", textAlign: "center" },
})
