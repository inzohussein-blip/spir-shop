import { Link } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { CategoryIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { Category, listCategories, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
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

export function ProductCarousel({ props }: BlockProps) {
  const products = useBlockProducts(props)
  if (products && !products.length) return null
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle title={str(props.title)} href={seeAllHref(props)} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {products.map((p) => (
            <View key={p.id} style={{ width: 140 }}>
              <ProductCard product={p} />
            </View>
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
    <View style={{ gap: 6 }}>
      <SectionTitle title={str(props.title)} />
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

/** Round icon per category with its name underneath (top of the home screen in the design). */
export function CategoryChips({ props }: BlockProps) {
  const [cats, setCats] = useState<Category[]>([])
  useEffect(() => {
    listCategories().then(setCats).catch(() => setCats([]))
  }, [])
  if (!cats.length) return null
  return (
    <View style={{ gap: 12 }}>
      <SectionTitle title={str(props.title)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 18, paddingHorizontal: 4 }}>
        {cats.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} asChild>
            <Pressable style={styles.cat} testID={`category-${c.id}`}>
              <View style={styles.catCircle}>
                <CategoryIcon name={c.name} size={24} />
              </View>
              <Text style={styles.catText} numberOfLines={2}>
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
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  more: { color: COLORS.muted, fontSize: 13 },
  cat: { alignItems: "center", width: 64, gap: 6 },
  catCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  catText: { fontSize: 11, color: COLORS.muted, textAlign: "center" },
})
