import { Image } from "expo-image"
import { Link } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"
import { Product } from "../lib/api"
import { COLORS, RADIUS } from "../lib/config"
import { formatIqd } from "../lib/format"
import { CategoryIcon } from "./Icon"
import Text from "./Text"

export function lowestPrice(p: Product) {
  const prices = p.variants.map((v) => v.calculated_price?.calculated_amount).filter((n): n is number => n != null)
  return prices.length ? Math.min(...prices) : null
}

/** Product tile: tall image on a light grey card, name, then bold price. */
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
            <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={40} color={COLORS.muted} />
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
  card: { flex: 1, margin: 7, gap: 4, maxWidth: "50%" },
  imageWrap: {
    aspectRatio: 0.74,
    borderRadius: RADIUS.image,
    backgroundColor: COLORS.soft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  image: { width: "100%", height: "100%" },
  title: { fontSize: 13, fontWeight: "500" },
  price: { fontSize: 16, fontWeight: "700" },
})
