import { Image } from "expo-image"
import { Link, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BackButton } from "../../components/Header"
import { CategoryIcon } from "../../components/Icon"
import Text from "../../components/Text"
import { Brand, listBrands, listProducts, Product } from "../../lib/api"
import { COLORS, RADIUS } from "../../lib/config"

const HEIGHTS = [[250, 230], [200, 230], [230, 210], [210, 250]]

function Tile({ p, height }: { p: Product; height: number }) {
  return (
    <Link href={`/product/${p.handle}`} asChild>
      <Pressable style={StyleSheet.flatten([styles.tile, { height }])} testID={`product-${p.handle}`}>
        {p.thumbnail ? <Image source={p.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : <CategoryIcon name={p.categories?.[0]?.name ?? ""} size={40} color={COLORS.muted} />}
      </Pressable>
    </Link>
  )
}

/**
 * Brand page (design: "collection"): big cover photo with the brand name, then
 * a staggered two-column wall of its products and a "view all" button.
 */
export default function BrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    listBrands()
      .then((all) => setBrand(all.find((b) => b.id === id) ?? null))
      .catch(() => undefined)
    listProducts({ collectionId: id })
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [id])

  const cover = (brand?.metadata as { image_url?: string } | null)?.image_url || products?.[0]?.thumbnail
  const cols: Product[][] = [[], []]
  ;(products ?? []).slice(0, 8).forEach((p, i) => cols[i % 2].push(p))

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} bounces={false}>
        <View style={[styles.cover, { height: 230 + insets.top }]}>
          {cover ? <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <View style={styles.shade} />
          <View style={[styles.coverTop, { paddingTop: insets.top + 12 }]}>
            <BackButton light />
          </View>
          <View style={styles.coverText}>
            <Text style={styles.brand} numberOfLines={2}>{brand?.title ?? ""}</Text>
            {brand?.metadata?.origin ? <Text style={styles.origin}>{brand.metadata.origin}</Text> : null}
          </View>
        </View>
        <View style={styles.sheet}>
          {!products ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
          ) : products.length ? (
            <View style={styles.wall}>
              {cols.map((col, c) => (
                <View key={c} style={{ flex: 1, gap: 14, marginTop: c === 1 ? -14 : 14 }}>
                  {col.map((p, i) => (
                    <Tile key={p.id} p={p} height={HEIGHTS[i % HEIGHTS.length][c]} />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ textAlign: "center", color: COLORS.muted, marginTop: 30 }}>لا توجد منتجات لهذه العلامة</Text>
          )}
        </View>
      </ScrollView>
      <Pressable
        style={[styles.viewAll, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push({ pathname: "/category/[id]", params: { id: "all", brand: id } })}
        testID="brand-view-all"
      >
        <Text style={styles.viewAllText}>عرض الكل</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  cover: { backgroundColor: "#d9c9bd", justifyContent: "flex-end" },
  shade: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.18)" },
  coverTop: { position: "absolute", top: 0, start: 24 },
  coverText: { position: "absolute", top: 0, bottom: 30, end: 24, maxWidth: "55%", justifyContent: "center" },
  brand: { color: "#fff", fontSize: 28, fontWeight: "700", lineHeight: 36, textAlign: "left" },
  origin: { color: "#fff", fontSize: 14, marginTop: 4, textAlign: "left" },
  sheet: { marginTop: -26, backgroundColor: COLORS.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 26 },
  wall: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  tile: { borderRadius: RADIUS.image - 6, backgroundColor: COLORS.soft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  viewAll: { position: "absolute", end: 0, backgroundColor: COLORS.dark, height: 54, paddingHorizontal: 38, borderTopStartRadius: 27, borderBottomStartRadius: 27, alignItems: "center", justifyContent: "center" },
  viewAllText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
})
