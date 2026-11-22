import { Image } from "expo-image"
import { Link } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"
import { Product } from "../lib/api"
import { COLORS } from "../lib/config"
import { formatIqd } from "../lib/format"
import Text from "./Text"

export function lowestPrice(p: Product) {
  const prices = p.variants.map((v) => v.calculated_price?.calculated_amount).filter((n): n is number => n != null)
  return prices.length ? Math.min(...prices) : null
}

export default function ProductCard({ product }: { product: Product }) {
  const price = lowestPrice(product)
  const multi = product.variants.length > 1
  return (
    <Link href={`/product/${product.handle}`} asChild>
      <Pressable style={styles.card} testID={`product-${product.handle}`}>
        <View style={styles.imageWrap}>
          {product.thumbnail ? (
            <Image source={product.thumbnail} style={styles.image} contentFit="cover" />
          ) : (
            <Text style={styles.placeholder}>💄</Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {price != null && (
          <Text style={styles.price}>
            {multi ? "من " : ""}
            {formatIqd(price)}
          </Text>
        )}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, gap: 6, maxWidth: "50%" },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: COLORS.soft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { fontSize: 40, textAlign: "center" },
  title: { fontSize: 14, fontWeight: "600" },
  price: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
})
