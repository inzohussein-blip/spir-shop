import { Image } from "expo-image"
import { Link } from "expo-router"
import { useEffect } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Product } from "../lib/api"
import { COLORS, IS_NATURAL, SHADOW } from "../lib/config"
import { formatIqd } from "../lib/format"
import { saleInfo, useStore } from "../lib/store"
import { CategoryIcon, HeartIcon } from "./Icon"
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

/** "-20%" corner badge on sale products. */
function SaleBadge({ product, small }: { product: Product; small?: boolean }) {
  const sale = saleInfo(product)
  if (!sale || sale.percent < 1) return null
  return (
    <View style={[styles.badge, small && styles.badgeSmall]}>
      <Text style={[styles.badgeText, small && { fontSize: 10 }]}>{`\u200E-${sale.percent}%`}</Text>
    </View>
  )
}

/** Price in the sale colour when discounted, with the old price struck through. */
function PriceLine({ product, size = 15 }: { product: Product; size?: number }) {
  const price = lowestPrice(product)
  const sale = saleInfo(product)
  if (price == null) return null
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.price, { fontSize: size }, sale && { color: COLORS.sale }]} numberOfLines={1}>
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

/** Small "★ 4.6 (12)" line. */
function RatingLine({ productId }: { productId: string }) {
  const { ratings, features } = useStore()
  const r = ratings[productId]
  if (!features.reviews || !r?.count) return null
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.ratingText}>
        {r.average.toFixed(1)} <Text style={{ color: COLORS.muted, fontSize: 11 }}>({r.count})</Text>
      </Text>
    </View>
  )
}

function Heart({ product, style }: { product: Product; style: object }) {
  const { isWished, toggleWish, features } = useStore()
  if (!features.wishlist) return null
  return (
    <Pressable
      style={style}
      onPress={(e) => {
        e.preventDefault?.()
        toggleWish(product.id)
      }}
      hitSlop={8}
      accessibilityLabel="المفضلة"
      testID={`wish-${product.handle}`}
    >
      <HeartIcon filled={isWished(product.id)} size={15} color={isWished(product.id) ? COLORS.sale : COLORS.primaryDark} />
    </Pressable>
  )
}

/**
 * Product tiles:
 *  - "grid" (home feed, results, wishlist): tall 3:4 photo with discount badge
 *    and heart, two-line name, price (sale colour + old price), rating
 *  - "featured" (home sliders): narrower version of the grid tile
 *  - "mini" (deals strip): small photo and price only
 *  - "compact": small photo beside name and price
 */
export default function ProductCard({ product, variant = "grid" }: { product: Product; variant?: "grid" | "featured" | "compact" | "mini" }) {
  const { requestRatings } = useStore()
  useEffect(() => {
    if (variant === "grid" || variant === "featured") requestRatings([product.id])
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

  if (variant === "mini") {
    const sale = saleInfo(product)
    return (
      <Link href={`/product/${product.handle}`} asChild>
        <Pressable style={styles.mini} testID={`product-${product.handle}`}>
          <View>
            <Thumb product={product} style={styles.miniImg} iconSize={26} />
            <SaleBadge product={product} small />
          </View>
          <Text style={[styles.miniPrice, sale && { color: COLORS.sale }]} numberOfLines={1}>
            {formatIqd(sale?.price ?? lowestPrice(product))}
          </Text>
          {sale ? (
            <Text style={styles.old} numberOfLines={1}>
              {formatIqd(sale.original)}
            </Text>
          ) : null}
        </Pressable>
      </Link>
    )
  }

  const featured = variant === "featured"
  return (
    <Link href={`/product/${product.handle}`} asChild>
      <Pressable style={featured ? styles.featured : styles.card} testID={`product-${product.handle}`}>
        <View>
          <Thumb product={product} style={styles.img} />
          <SaleBadge product={product} />
          <Heart product={product} style={styles.heart} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <PriceLine product={product} size={featured ? 14 : 15} />
          <RatingLine productId={product.id} />
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  thumb: { backgroundColor: COLORS.soft, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  card: {
    flex: 1,
    margin: 4,
    maxWidth: "50%",
    backgroundColor: COLORS.card,
    borderRadius: IS_NATURAL ? 16 : 6,
    overflow: "hidden",
    ...(IS_NATURAL ? {} : { borderWidth: StyleSheet.hairlineWidth, borderColor: "#ececec" }),
  },
  featured: { width: 132, backgroundColor: COLORS.card, borderRadius: IS_NATURAL ? 14 : 6, overflow: "hidden" },
  img: { width: "100%", aspectRatio: 0.75 },
  info: { paddingHorizontal: 8, paddingTop: 7, paddingBottom: 9, gap: 4 },
  title: { fontSize: 12, lineHeight: 17, color: COLORS.text, minHeight: 34 },
  badge: { position: "absolute", top: 0, start: 0, backgroundColor: COLORS.sale, paddingHorizontal: 7, paddingVertical: 3, borderBottomEndRadius: 8 },
  badgeSmall: { paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  heart: {
    position: "absolute",
    bottom: 8,
    end: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap" },
  price: { fontWeight: "700", color: COLORS.primaryDark },
  old: { fontSize: 11, color: "#a8a8ad", textDecorationLine: "line-through" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  star: { color: "#f5a623", fontSize: 12 },
  ratingText: { fontSize: 11, color: COLORS.text },
  mini: { width: 104, gap: 3 },
  miniImg: { width: 104, height: 138, borderRadius: 6 },
  miniPrice: { fontSize: 13, fontWeight: "700", color: COLORS.primaryDark, marginTop: 3 },
  compact: {
    width: 212,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
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
})
