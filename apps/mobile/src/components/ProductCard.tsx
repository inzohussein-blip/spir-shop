import { Image } from "expo-image"
import { Link } from "expo-router"
import { useEffect } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Product } from "../lib/api"
import { COLORS, SHADOW } from "../lib/config"
import { formatIqd } from "../lib/format"
import { saleInfo, useStore } from "../lib/store"
import { CategoryIcon, HeartIcon } from "./Icon"
import Stars from "./Stars"
import Text from "./Text"

export function lowestPrice(p: Product) {
  const prices = p.variants.map((v) => v.calculated_price?.calculated_amount).filter((n): n is number => n != null)
  return prices.length ? Math.min(...prices) : null
}

function Thumb({ product, style, iconSize = 40 }: { product: Product; style: object; iconSize?: number }) {
  return (
    <View style={[styles.thumb, style]}>
      {product.thumbnail ? (
        <Image source={product.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={iconSize} color={COLORS.muted} />
      )}
    </View>
  )
}

function PriceLine({ product, size = 15 }: { product: Product; size?: number }) {
  const price = lowestPrice(product)
  const sale = saleInfo(product)
  if (price == null) return null
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.price, { fontSize: size }]} numberOfLines={1}>
        {formatIqd(sale?.price ?? price)}
      </Text>
      {sale ? (
        <Text style={styles.old} numberOfLines={1}>
          {formatIqd(sale.original)}
        </Text>
      ) : null}
    </View>
  )
}

/**
 * Product tiles from the design:
 *  - "grid" (results, wishlist): image with heart, name, price (+ old price), stars
 *  - "featured" (home sliders): tall image, name, price
 *  - "compact" (home "recommended"): small image beside name and price
 */
export default function ProductCard({ product, variant = "grid" }: { product: Product; variant?: "grid" | "featured" | "compact" }) {
  const { isWished, toggleWish, ratings, requestRatings } = useStore()
  useEffect(() => {
    if (variant === "grid") requestRatings([product.id])
  }, [product.id, requestRatings, variant])

  if (variant === "compact") {
    return (
      <Link href={`/product/${product.handle}`} asChild>
        <Pressable style={styles.compact} testID={`product-${product.handle}`}>
          <Thumb product={product} style={styles.compactImg} iconSize={26} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.compactTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <PriceLine product={product} size={15} />
          </View>
        </Pressable>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link href={`/product/${product.handle}`} asChild>
        <Pressable style={styles.featured} testID={`product-${product.handle}`}>
          <Thumb product={product} style={styles.featuredImg} />
          <Text style={styles.title} numberOfLines={1}>
            {product.title}
          </Text>
          <PriceLine product={product} size={16} />
        </Pressable>
      </Link>
    )
  }

  const rating = ratings[product.id]
  const wished = isWished(product.id)
  return (
    <Link href={`/product/${product.handle}`} asChild>
      <Pressable style={styles.card} testID={`product-${product.handle}`}>
        <View>
          <Thumb product={product} style={styles.gridImg} />
          <Pressable
            style={styles.heart}
            onPress={(e) => {
              e.preventDefault?.()
              toggleWish(product.id)
            }}
            hitSlop={8}
            accessibilityLabel="المفضلة"
            testID={`wish-${product.handle}`}
          >
            <HeartIcon filled={wished} size={15} color="#d3d6da" solid />
          </Pressable>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>
        <PriceLine product={product} />
        {rating?.count ? <Stars value={rating.average} count={rating.count} size={10} /> : null}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  thumb: { backgroundColor: "#f3f3f3", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  card: { flex: 1, margin: 8, gap: 5, maxWidth: "50%" },
  gridImg: { aspectRatio: 0.78, borderRadius: 10, marginBottom: 6 },
  heart: {
    position: "absolute",
    top: 8,
    end: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  featured: { width: 126, gap: 6 },
  featuredImg: { width: 126, height: 172, borderRadius: 10, marginBottom: 4 },
  compact: {
    width: 212,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 0,
    paddingEnd: 12,
    borderWidth: 1,
    borderColor: "#f1f1f1",
    ...SHADOW,
    shadowOpacity: 0.04,
  },
  compactImg: { width: 66, height: 66, borderRadius: 10 },
  compactTitle: { fontSize: 13, fontWeight: "500" },
  title: { fontSize: 13, fontWeight: "500", color: COLORS.primaryDark },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  price: { fontWeight: "700", color: COLORS.primaryDark },
  old: { fontSize: 11, color: "#b5b5b9", textDecorationLine: "line-through" },
})
