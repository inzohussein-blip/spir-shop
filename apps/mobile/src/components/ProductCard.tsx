import { Image } from "expo-image"
import { Link, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Product } from "../lib/api"
import { useCart } from "../lib/cart"
import { COLORS, RADIUS } from "../lib/config"
import { formatIqd } from "../lib/format"
import { saleInfo, useStore } from "../lib/store"
import Icon, { CategoryIcon, HeartIcon } from "./Icon"
import Stars from "./Stars"
import Text from "./Text"

export function lowestPrice(p: Product) {
  const prices = p.variants.map((v) => v.calculated_price?.calculated_amount).filter((n): n is number => n != null)
  return prices.length ? Math.min(...prices) : null
}

/**
 * Product tile: image with discount badge, wishlist heart and quick-add button,
 * then brand, name, rating and price (old price struck through when on sale).
 */
export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem } = useCart()
  const { isWished, toggleWish, ratings, requestRatings } = useStore()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    requestRatings([product.id])
  }, [product.id, requestRatings])

  const price = lowestPrice(product)
  // "from" only when variants have different prices
  const multi = new Set(product.variants.map((v) => v.calculated_price?.calculated_amount)).size > 1
  const sale = saleInfo(product)
  const rating = ratings[product.id]
  const wished = isWished(product.id)

  const quickAdd = async () => {
    // Products with shades/sizes need a choice first
    if (product.variants.length !== 1) {
      router.push(`/product/${product.handle}`)
      return
    }
    try {
      await addItem(product.variants[0].id)
      setAdded(true)
      setTimeout(() => setAdded(false), 1400)
    } catch {
      router.push(`/product/${product.handle}`)
    }
  }

  return (
    <Link href={`/product/${product.handle}`} asChild>
      <Pressable style={styles.card} testID={`product-${product.handle}`}>
        <View style={styles.imageWrap}>
          {product.thumbnail ? (
            <Image source={product.thumbnail} style={styles.image} contentFit="cover" />
          ) : (
            <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={40} color={COLORS.muted} />
          )}
          {sale ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{`-${sale.percent}%`}</Text>
            </View>
          ) : null}
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
            <HeartIcon filled={wished} size={16} />
          </Pressable>
          <Pressable
            style={[styles.add, added && { backgroundColor: COLORS.accent }]}
            onPress={(e) => {
              e.preventDefault?.()
              quickAdd()
            }}
            hitSlop={6}
            accessibilityLabel="أضف إلى السلة"
            testID={`quick-add-${product.handle}`}
          >
            <Icon name={added ? "check" : "plus"} size={17} color="#fff" />
          </Pressable>
        </View>
        {product.collection?.title ? (
          <Text style={styles.brand} numberOfLines={1}>
            {product.collection.title}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {rating?.count ? <Stars value={rating.average} count={rating.count} size={11} /> : null}
        {price != null && (
          <View style={styles.priceRow}>
            <Text style={styles.price} numberOfLines={1}>
              {multi ? "من " : ""}
              {formatIqd(sale?.price ?? price)}
            </Text>
            {sale ? (
              <Text style={styles.old} numberOfLines={1}>
                {new Intl.NumberFormat("en-US").format(sale.original)}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 7, gap: 3, maxWidth: "50%" },
  imageWrap: {
    aspectRatio: 0.8,
    borderRadius: RADIUS.image,
    backgroundColor: COLORS.soft,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  image: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    start: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heart: {
    position: "absolute",
    top: 8,
    end: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  add: {
    position: "absolute",
    bottom: 8,
    end: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 11, color: COLORS.muted, fontWeight: "700", letterSpacing: 0.3 },
  title: { fontSize: 13, fontWeight: "500", lineHeight: 19 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "nowrap" },
  price: { fontSize: 15, fontWeight: "700" },
  old: { fontSize: 11, color: COLORS.muted, textDecorationLine: "line-through" },
})
