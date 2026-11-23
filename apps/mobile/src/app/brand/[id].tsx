import { Stack, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { Brand, listBrands, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { BrandMark } from "../../sdui/blocks/brands"

/** Brand page: brand header + its products. */
export default function BrandScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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

  return (
    <>
      <Stack.Screen options={{ title: brand?.title ?? "" }} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ backgroundColor: COLORS.bg }}
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: 11 }}
          ListHeaderComponent={
            brand ? (
              <View style={styles.header}>
                <BrandMark title={brand.title} size={26} />
                <Text style={styles.sub}>
                  {[brand.metadata?.origin, `${products.length} منتج`].filter(Boolean).join(" • ")}
                </Text>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Text style={styles.empty}>لا توجد منتجات لهذه العلامة</Text>}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 28,
    marginHorizontal: 7,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.soft,
  },
  sub: { fontSize: 13, color: COLORS.muted },
  empty: { textAlign: "center", marginTop: 40, color: COLORS.muted },
})
