import { Stack, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList } from "react-native"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { listCategories, listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"

/** Product list for a category ("all" = every product), optionally filtered by a search query. */
export default function CategoryScreen() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [title, setTitle] = useState(q ? `نتائج: ${q}` : "كل المنتجات")

  useEffect(() => {
    const categoryId = id && id !== "all" ? id : undefined
    listProducts({ categoryId, q: q || undefined })
      .then(setProducts)
      .catch(() => setProducts([]))
    if (categoryId && !q) {
      listCategories()
        .then((cats) => {
          const c = cats.find((x) => x.id === categoryId)
          if (c) setTitle(c.name)
        })
        .catch(() => undefined)
    }
  }, [id, q])

  return (
    <>
      <Stack.Screen options={{ title }} />
      {!products ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: 10 }}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40, color: COLORS.muted }}>لا توجد منتجات</Text>
          }
        />
      )}
    </>
  )
}
