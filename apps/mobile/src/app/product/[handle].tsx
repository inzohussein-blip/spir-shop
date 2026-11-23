import { Image } from "expo-image"
import { Link, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { CategoryIcon, HeartIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Stars from "../../components/Stars"
import Text from "../../components/Text"
import { getProduct, getReviews, listProducts, Product, Review, ReviewSummary, Variant } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { useStore } from "../../lib/store"

type Tab = "description" | "how" | "ingredients" | "reviews"

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { addItem, loading } = useCart()
  const { isWished, toggleWish, settings, address } = useStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [reviews, setReviews] = useState<{ summary: ReviewSummary; reviews: Review[] } | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [tab, setTab] = useState<Tab>("description")
  const [error, setError] = useState(false)

  useEffect(() => {
    getProduct(handle)
      .then((p) => {
        setProduct(p)
        if (!p) return
        // Pre-select the first variant that is in stock
        const firstInStock = p.variants.find((v) => !v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0)
        setVariantId((firstInStock ?? p.variants[0])?.id ?? null)
        getReviews(p.id).then(setReviews).catch(() => undefined)
        listProducts({ categoryId: p.categories?.[0]?.id, limit: 8 })
          .then((list) => setSimilar(list.filter((x) => x.id !== p.id)))
          .catch(() => undefined)
      })
      .catch(() => setError(true))
  }, [handle])

  const images = useMemo(() => {
    if (!product) return []
    const all = [product.thumbnail, ...(product.images ?? []).map((i) => i.url)].filter((u): u is string => !!u)
    return [...new Set(all)]
  }, [product])

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"))

  if (error) return <Text style={styles.center}>تعذّر تحميل المنتج</Text>
  if (!product) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />

  const variant = product.variants.find((v) => v.id === variantId)
  const inStockOf = (v?: Variant) => !!v && (!v.manage_inventory || !!v.allow_backorder || (v.inventory_quantity ?? 0) > 0)
  const inStock = inStockOf(variant)
  const lowStock = variant?.manage_inventory && !variant.allow_backorder && (variant.inventory_quantity ?? 0) > 0 && (variant.inventory_quantity ?? 0) <= 5
  const price = variant?.calculated_price?.calculated_amount
  const original = variant?.calculated_price?.original_amount
  const onSale = price != null && original != null && original > price
  const percent = onSale ? Math.round((1 - price! / original!) * 100) : 0

  // Color swatches: product.metadata.swatches = { "<option value>": "#hex" }
  const swatches = product.metadata?.swatches ?? {}
  const swatchFor = (v: Variant) => {
    const value = v.options?.map((o) => o.value).find((val) => swatches[val]) ?? v.title
    const hex = swatches[value]
    return typeof hex === "string" && /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : null
  }
  const hasSwatches = product.variants.some((v) => swatchFor(v))
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const howTo = typeof meta.how_to_use === "string" ? meta.how_to_use : ""
  const ingredients = typeof meta.ingredients === "string" ? meta.ingredients : ""
  const badges = Array.isArray(meta.badges) ? (meta.badges as string[]) : []
  const wished = isWished(product.id)
  const province = address?.province || "بغداد"
  const eta = province === "بغداد" ? settings.baghdad_eta : settings.provinces_eta

  const tabs: { key: Tab; label: string }[] = [
    { key: "description" as Tab, label: "الوصف" },
    ...(howTo ? [{ key: "how" as Tab, label: "طريقة الاستخدام" }] : []),
    ...(ingredients ? [{ key: "ingredients" as Tab, label: "المكونات" }] : []),
    { key: "reviews" as Tab, label: `التقييمات${reviews?.summary.count ? ` (${reviews.summary.count})` : ""}` },
  ]

  const onAdd = async () => {
    if (!variant) return
    try {
      await addItem(variant.id, qty)
      router.push("/cart")
    } catch (e) {
      Alert.alert("خطأ", (e as Error).message)
    }
  }

  const share = () => {
    const message = `${product.title}${price != null ? ` - ${formatIqd(price)}` : ""}`
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(message).catch(() => undefined)
      return
    }
    Share.share({ message })
  }

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setImageIndex(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        {/* Gallery */}
        <View style={styles.hero}>
          {images.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onGalleryScroll}>
              {images.map((u) => (
                <Image key={u} source={u} style={{ width, height: 400 }} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroCircle}>
              <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={72} color={COLORS.muted} />
            </View>
          )}
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((u, i) => (
                <View key={u} style={[styles.dot, i === imageIndex && styles.dotOn]} />
              ))}
            </View>
          ) : null}
          <View style={[styles.topBar, { top: insets.top + 12 }]}>
            <Pressable style={styles.roundBtn} onPress={back} accessibilityLabel="رجوع" testID="product-back">
              {/* In RTL "back" points to the right */}
              <Icon name="chevron-right" size={20} />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable style={styles.roundBtn} onPress={share} accessibilityLabel="مشاركة">
                <Icon name="share-2" size={17} />
              </Pressable>
              <Pressable style={styles.roundBtn} onPress={() => toggleWish(product.id)} accessibilityLabel="المفضلة" testID="product-wish">
                <HeartIcon filled={wished} size={19} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.badges}>
            {settings.trust_badges[0] ? (
              <View style={[styles.badge, { backgroundColor: "#eaf3f0" }]}>
                <Text style={[styles.badgeText, { color: COLORS.accent }]}>✓ {settings.trust_badges[0]}</Text>
              </View>
            ) : null}
            {badges.includes("bestseller") ? (
              <View style={[styles.badge, { backgroundColor: "#fdf3e1" }]}>
                <Text style={[styles.badgeText, { color: "#a5741a" }]}>الأكثر مبيعاً</Text>
              </View>
            ) : null}
            {badges.includes("new") ? (
              <View style={[styles.badge, { backgroundColor: "#e8eefb" }]}>
                <Text style={[styles.badgeText, { color: "#3b62b8" }]}>جديد</Text>
              </View>
            ) : null}
          </View>

          {product.collection ? (
            <Link href={`/brand/${product.collection.id}`} asChild>
              <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" }}>
                <Text style={styles.brand}>{product.collection.title}</Text>
                <Icon name="chevron-left" size={14} color={COLORS.muted} />
              </Pressable>
            </Link>
          ) : null}

          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>{formatIqd(price)}</Text>
              {onSale ? (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  <Text style={styles.old}>{formatIqd(original)}</Text>
                  <Text style={styles.percent}>-{percent}%</Text>
                </View>
              ) : null}
            </View>
          </View>

          {reviews?.summary.count ? (
            <Pressable onPress={() => setTab("reviews")} style={{ marginTop: 6 }}>
              <Stars value={reviews.summary.average} count={reviews.summary.count} size={14} />
            </Pressable>
          ) : null}

          <Text style={[styles.stock, !inStock && { color: COLORS.danger }]}>
            {!inStock ? "نفد من المخزون" : lowStock ? `متبقي ${variant?.inventory_quantity} قطع فقط` : "متوفر"}
          </Text>

          {product.variants.length > 1 && (
            <View style={styles.optionBlock}>
              <Text style={styles.optionLabel}>
                {hasSwatches ? "الدرجة: " : "الحجم: "}
                <Text style={{ fontWeight: "700" }}>{variant?.title ?? ""}</Text>
              </Text>
              <View style={styles.variants}>
                {product.variants.map((v) => {
                  const color = swatchFor(v)
                  const active = v.id === variantId
                  const available = inStockOf(v)
                  return color ? (
                    <Pressable
                      key={v.id}
                      onPress={() => setVariantId(v.id)}
                      style={[styles.swatchRing, active && styles.swatchRingActive, !available && { opacity: 0.35 }]}
                      accessibilityLabel={v.title}
                      testID={`swatch-${v.title}`}
                    >
                      <View style={[styles.swatch, { backgroundColor: color }]} />
                    </Pressable>
                  ) : (
                    <Pressable
                      key={v.id}
                      onPress={() => setVariantId(v.id)}
                      style={[styles.size, active && styles.sizeActive, !available && { opacity: 0.4 }]}
                      testID={`size-${v.title}`}
                    >
                      <Text style={[styles.sizeText, active && { color: "#fff" }]}>{v.title}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          <View style={styles.delivery} testID="delivery-estimate">
            <Icon name="truck" size={20} color={COLORS.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: "700" }}>
                يوصلك إلى {province} {eta}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.muted }}>
                {settings.free_shipping_threshold
                  ? `توصيل مجاني للطلبات من ${formatIqd(settings.free_shipping_threshold)} • الدفع عند الاستلام`
                  : "الدفع عند الاستلام"}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((t) => (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabOn]} testID={`tab-${t.key}`}>
                <Text style={[styles.tabText, tab === t.key && { color: COLORS.text, fontWeight: "700" }]}>{t.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ paddingVertical: 14 }}>
            {tab === "description" ? <Text style={styles.body}>{product.description || "-"}</Text> : null}
            {tab === "how" ? <Text style={styles.body}>{howTo}</Text> : null}
            {tab === "ingredients" ? <Text style={styles.body}>{ingredients}</Text> : null}
            {tab === "reviews" ? <ReviewsPanel data={reviews} /> : null}
          </View>

          {similar.length > 0 && (
            <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700" }}>منتجات مشابهة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similar.map((p) => (
                  <View key={p.id} style={{ width: 150 }}>
                    <ProductCard product={p} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 14 + insets.bottom }]}>
        <View style={styles.qty}>
          <Pressable onPress={() => setQty((q) => Math.min(20, q + 1))} hitSlop={8} testID="qty-plus">
            <Icon name="plus" size={18} />
          </Pressable>
          <Text style={{ fontWeight: "700", minWidth: 18, textAlign: "center" }} testID="qty-value">
            {qty}
          </Text>
          <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} hitSlop={8} testID="qty-minus">
            <Icon name="minus" size={18} />
          </Pressable>
        </View>
        <Pressable
          style={[styles.addBtn, (!inStock || loading) && { opacity: 0.5 }]}
          disabled={!inStock || loading}
          onPress={onAdd}
          testID="add-to-cart"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="shopping-bag" size={19} color="#fff" />
              <Text style={styles.addText} numberOfLines={1}>
                {inStock ? `أضيفي للسلة • ${formatIqd((price ?? 0) * qty)}` : "نفد من المخزون"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

/** Rating summary (average + distribution) and the latest reviews. */
function ReviewsPanel({ data }: { data: { summary: ReviewSummary; reviews: Review[] } | null }) {
  if (!data) return <ActivityIndicator color={COLORS.primary} />
  if (!data.summary.count) {
    return <Text style={styles.body}>لا توجد تقييمات بعد. بعد استلام طلبك تقدرين تقيّمين المنتج من صفحة الطلب.</Text>
  }
  const max = Math.max(...data.summary.distribution.map((d) => d.count), 1)
  return (
    <View style={{ gap: 16 }} testID="reviews-panel">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 36, fontWeight: "700" }}>{data.summary.average.toFixed(1)}</Text>
          <Text style={{ fontSize: 11, color: COLORS.muted }}>من 5</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          {data.summary.distribution.map((d) => (
            <View key={d.star} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 11, width: 22 }}>{d.star}★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(d.count / max) * 100}%` }]} />
              </View>
              <Text style={{ fontSize: 11, color: COLORS.muted, width: 20 }}>{d.count}</Text>
            </View>
          ))}
        </View>
      </View>
      {data.reviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontWeight: "700" }}>{r.name}</Text>
            <Text style={{ fontSize: 11, color: COLORS.muted }}>{new Date(r.created_at).toLocaleDateString("ar-IQ")}</Text>
          </View>
          <Stars value={r.rating} size={12} />
          {r.comment ? <Text style={styles.body}>{r.comment}</Text> : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: "center", marginTop: 80 },
  hero: { height: 400, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  heroCircle: { width: 240, height: 240, borderRadius: 120, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", bottom: 40, flexDirection: "row", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.2)" },
  dotOn: { width: 18, backgroundColor: COLORS.primary },
  topBar: { position: "absolute", left: 20, right: 20, flexDirection: "row", justifyContent: "space-between" },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  sheet: {
    marginTop: -28,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  badges: { flexDirection: "row", gap: 6, marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  brand: { fontSize: 13, fontWeight: "700", color: COLORS.muted },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: 2 },
  title: { flex: 1, fontSize: 20, fontWeight: "700", lineHeight: 28 },
  price: { fontSize: 21, fontWeight: "700" },
  old: { fontSize: 13, color: COLORS.muted, textDecorationLine: "line-through" },
  percent: { fontSize: 12, color: COLORS.danger, fontWeight: "700" },
  stock: { fontSize: 12, color: COLORS.accent, marginTop: 6 },
  optionBlock: { gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 14 },
  optionLabel: { fontSize: 13, color: COLORS.muted },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: "transparent" },
  swatchRingActive: { borderColor: COLORS.primary },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  size: { minWidth: 44, height: 44, borderRadius: 22, paddingHorizontal: 12, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  sizeActive: { backgroundColor: COLORS.primary },
  sizeText: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  delivery: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginTop: 6 },
  tabs: { gap: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginTop: 16 },
  tab: { paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabOn: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.muted },
  body: { fontSize: 13, lineHeight: 22, color: "#444" },
  barTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: COLORS.soft, overflow: "hidden" },
  barFill: { height: 5, backgroundColor: COLORS.accent },
  review: { gap: 4, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 14,
  },
  addBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  addText: { color: "#fff", fontSize: 15, fontWeight: "700" },
})
