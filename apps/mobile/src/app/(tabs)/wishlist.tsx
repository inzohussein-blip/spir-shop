import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import { HeartIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { listProducts, Product } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { useStore } from "../../lib/store"

/** Saved products (kept on the device). */
export default function WishlistScreen() {
  const router = useRouter()
  const { wishlist } = useStore()
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    if (!wishlist.length) {
      setProducts([])
      return
    }
    listProducts({ ids: wishlist, limit: 100 })
      // keep the order in which they were saved
      .then((list) => setProducts(wishlist.map((id) => list.find((p) => p.id === id)).filter((p): p is Product => !!p)))
      .catch(() => setProducts([]))
  }, [wishlist])

  if (!products) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />

  if (!products.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <HeartIcon filled={false} size={40} />
        </View>
        <Text style={styles.emptyTitle}>المفضلة فارغة</Text>
        <Text style={styles.emptyText}>اضغطي ♡ على أي منتج حتى تحفظيه هنا</Text>
        <Button label="تصفّحي المنتجات" onPress={() => router.push("/")} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    )
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg }}
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={2}
      contentContainerStyle={{ padding: 11 }}
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32, backgroundColor: COLORS.bg },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.muted },
})
