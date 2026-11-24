import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ReactNode, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Header, { BackButton } from "../../components/Header"
import Icon, { CategoryIcon, HeartIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Stars from "../../components/Stars"
import Text from "../../components/Text"
import { getProduct, getReviews, listProducts, Product, Review, ReviewSummary, Variant } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS, IS_NATURAL, SHADOW } from "../../lib/config"
import { formatIqd, timeAgo } from "../../lib/format"
import { useStore } from "../../lib/store"

type Section = "description" | "how" | "ingredients" | "reviews" | "similar"

/** Row with a title and a chevron that opens its content underneath (design: "Description ⌄"). */
function Collapsible({ title, open, onToggle, children, testID }: { title: string; open: boolean; onToggle: () => void; children: ReactNode; testID?: string }) {
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHead} onPress={onToggle} testID={testID}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Icon name={open ? "chevron-down" : "chevron-left"} size={20} />
      </Pressable>
      {open ? <View style={{ paddingBottom: 18 }}>{children}</View> : null}
    </View>
  )
}

/** Product page (design: "product" / "product full"). */
export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { addItem, loading } = useCart()
  const { isWished, toggleWish } = useStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [reviews, setReviews] = useState<{ summary: ReviewSummary; reviews: Review[] } | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const [open, setOpen] = useState<Section[]>([])
  const [more, setMore] = useState(false)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState(false)

  useEffect(() => {
    getProduct(handle)
      .then((p) => {
        setProduct(p)
        if (!p) return
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

  if (error) return <Text style={styles.center}>تعذّر تحميل المنتج</Text>
  if (!product) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />

  const toggle = (s: Section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  }

  const variant = product.variants.find((v) => v.id === variantId)
  const inStockOf = (v?: Variant) => !!v && (!v.manage_inventory || !!v.allow_backorder || (v.inventory_quantity ?? 0) > 0)
  const inStock = inStockOf(variant)
  const price = variant?.calculated_price?.calculated_amount
  const original = variant?.calculated_price?.original_amount
  const onSale = price != null && original != null && original > price

  const swatches = product.metadata?.swatches ?? {}
  const swatchFor = (v: Variant) => {
    const value = v.options?.map((o) => o.value).find((val) => swatches[val]) ?? v.title
    const hex = swatches[value]
    return typeof hex === "string" && /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : null
  }
  const colorVariants = product.variants.filter((v) => swatchFor(v))
  const sizeVariants = product.variants.length > 1 ? product.variants.filter((v) => !swatchFor(v)) : []
  const meta = (product.metadata ?? {}) as Record<string, unknown>
  const howTo = typeof meta.how_to_use === "string" ? meta.how_to_use : ""
  const ingredients = typeof meta.ingredients === "string" ? meta.ingredients : ""
  const description = product.description || ""
  const longText = description.length > 160

  const onAdd = async () => {
    if (!variant) return
    try {
      await addItem(variant.id, IS_NATURAL ? qty : 1)
      router.push("/cart")
    } catch (e) {
      Alert.alert("خطأ", (e as Error).message)
    }
  }

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setImageIndex(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))

  const sections = (
    <>
      <Collapsible title="الوصف" open={open.includes("description")} onToggle={() => toggle("description")} testID="tab-description">
        <Text style={styles.body} numberOfLines={more || !longText ? undefined : 4}>
          {description || "-"}
        </Text>
        {longText && !more ? (
          <Pressable onPress={() => setMore(true)}>
            <Text style={styles.readMore}>اقرأ المزيد</Text>
          </Pressable>
        ) : null}
      </Collapsible>
      {howTo ? (
        <Collapsible title="طريقة الاستخدام" open={open.includes("how")} onToggle={() => toggle("how")} testID="tab-how">
          <Text style={styles.body}>{howTo}</Text>
        </Collapsible>
      ) : null}
      {ingredients ? (
        <Collapsible title="المكونات" open={open.includes("ingredients")} onToggle={() => toggle("ingredients")} testID="tab-ingredients">
          <Text style={styles.body}>{ingredients}</Text>
        </Collapsible>
      ) : null}
      <Collapsible title="التقييمات" open={open.includes("reviews")} onToggle={() => toggle("reviews")} testID="tab-reviews">
        <ReviewsPanel data={reviews} onWrite={() => router.push("/orders")} />
      </Collapsible>
      {similar.length ? (
        <Collapsible title="منتجات مشابهة" open={open.includes("similar")} onToggle={() => toggle("similar")} testID="tab-similar">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} variant="featured" />
            ))}
          </ScrollView>
        </Collapsible>
      ) : null}
    </>
  )

  if (IS_NATURAL) {
    // "natural" theme (green design): photo card, brand row, size + quantity, floating total and add button
    const cardW = width - 40
    const brandInitials = (product.collection?.title ?? "S").replace(/[^A-Za-z\u0600-\u06FF ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    const options = colorVariants.length ? colorVariants : sizeVariants
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header
          title="التفاصيل"
          right={
            <Pressable onPress={() => router.push("/cart")} style={n.round} accessibilityLabel="السلة" testID="product-cart">
              <Icon name="shopping-bag" size={19} />
            </Pressable>
          }
        />
        <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
          <View style={[n.hero, { width: cardW }]}>
            {images.length ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setImageIndex(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / cardW))}>
                {images.map((u) => (
                  <Image key={u} source={u} style={{ width: cardW, height: 270 }} contentFit="cover" />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.heroIcon}>
                <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={80} color={COLORS.muted} />
              </View>
            )}
          </View>
          {images.length > 1 ? (
            <View style={n.dots}>
              {images.map((u, i) => (
                <View key={u} style={[n.dot, i === imageIndex && n.dotOn]} />
              ))}
            </View>
          ) : null}
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <Text style={n.kind}>{product.categories?.[0]?.name ?? ""}</Text>
            <View style={n.titleRow}>
              <Text style={n.title}>{product.title}</Text>
              <Pressable style={n.round} onPress={() => toggleWish(product.id)} accessibilityLabel="المفضلة" testID="product-wish">
                <HeartIcon filled={isWished(product.id)} size={20} color={COLORS.primaryDark} />
              </Pressable>
            </View>
            {reviews?.summary.count ? (
              <Pressable onPress={() => !open.includes("reviews") && toggle("reviews")} style={{ marginTop: 6 }}>
                <Stars value={reviews.summary.average} count={reviews.summary.count} size={15} gap={2} />
              </Pressable>
            ) : null}
            {product.collection ? (
              <View style={n.brandRow}>
                <View style={n.logo}>
                  <Text style={n.logoText}>{brandInitials || "S"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={n.brandName} numberOfLines={1}>{`${product.collection.title} ✓`}</Text>
                  <Text style={n.brandSub}>وكيل رسمي • أصلي 100%</Text>
                </View>
                <Pressable style={n.follow} onPress={() => router.push(`/brand/${product.collection!.id}`)} testID="product-brand">
                  <Icon name="grid" size={13} color="#fff" />
                  <Text style={n.followText}>كل منتجاتها</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={n.labels}>
              <Text style={n.label}>{options.length ? (colorVariants.length ? "اختاري اللون" : "اختاري الحجم") : ""}</Text>
              <Text style={n.label}>الكمية</Text>
            </View>
            <View style={n.optRow}>
              <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {options.map((v) => {
                  const active = v.id === variantId
                  const hex = swatchFor(v)
                  return hex ? (
                    <Pressable key={v.id} onPress={() => setVariantId(v.id)} style={[n.swatchWrap, active && n.swatchOn, !inStockOf(v) && { opacity: 0.35 }]} accessibilityLabel={v.title} testID={`swatch-${v.title}`}>
                      <View style={[n.swatch, { backgroundColor: hex }]} />
                    </Pressable>
                  ) : (
                    <Pressable key={v.id} onPress={() => setVariantId(v.id)} style={[n.size, active && n.sizeOn, !inStockOf(v) && { opacity: 0.4 }]} testID={`size-${v.title}`}>
                      <Text style={[n.sizeText, active && { color: COLORS.onPrimary }]} numberOfLines={1}>{v.title}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <View style={n.qty}>
                <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={n.qtyBtn} hitSlop={6} testID="qty-minus">
                  <Icon name="minus" size={15} />
                </Pressable>
                <Text style={n.qtyText} testID="qty-value">{qty}</Text>
                <Pressable onPress={() => setQty((q) => Math.min(20, q + 1))} style={n.qtyBtn} hitSlop={6} testID="qty-plus">
                  <Icon name="plus" size={15} />
                </Pressable>
              </View>
            </View>
            {colorVariants.length && variant ? <Text style={[n.brandSub, { marginTop: 8 }]}>{variant.title}</Text> : null}
            <View style={{ marginTop: 10 }}>{sections}</View>
          </View>
        </ScrollView>

        <View style={[n.buyBar, { bottom: insets.bottom + 16 }]}>
          <View>
            <Text style={n.totalLabel}>المجموع</Text>
            <Text style={n.total} testID="product-total">{formatIqd((price ?? 0) * qty)}</Text>
            {onSale ? <Text style={styles.old}>{formatIqd((original ?? 0) * qty)}</Text> : null}
          </View>
          <Pressable style={[n.add, (!inStock || loading) && { opacity: 0.5 }]} disabled={!inStock || loading} onPress={onAdd} testID="add-to-cart">
            {loading ? (
              <ActivityIndicator color={COLORS.onPrimary} />
            ) : (
              <>
                <Icon name="shopping-bag" size={18} color={COLORS.onPrimary} />
                <Text style={n.addText}>{inStock ? "أضيفي للسلة" : "نفد من المخزون"}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {/* Photo on a soft circle, page dots, back and wishlist buttons */}
        <View style={[styles.hero, { height: 400 + insets.top }]}>
          <View style={[styles.heroCircle, { top: insets.top + 90 }]} />
          {images.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onGalleryScroll}>
              {images.map((u) => (
                <Image key={u} source={u} style={{ width, height: 400 + insets.top }} contentFit="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroIcon}>
              <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={80} color={COLORS.muted} />
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
            <BackButton />
            <Pressable style={styles.heartBtn} onPress={() => toggleWish(product.id)} accessibilityLabel="المفضلة" testID="product-wish">
              <HeartIcon filled={isWished(product.id)} size={20} color="#ff6464" />
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={styles.title}>{product.title}</Text>
              {reviews?.summary.count ? (
                <Pressable onPress={() => !open.includes("reviews") && toggle("reviews")}>
                  <Stars value={reviews.summary.average} count={reviews.summary.count} size={19} gap={3} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.price}>{formatIqd(price)}</Text>
              {onSale ? <Text style={styles.old}>{formatIqd(original)}</Text> : null}
            </View>
          </View>

          {colorVariants.length || sizeVariants.length ? (
            <View style={styles.options}>
              {colorVariants.length ? (
                <View style={{ gap: 12, flex: 1 }}>
                  <Text style={styles.optLabel}>اللون</Text>
                  <View style={styles.optRow}>
                    {colorVariants.map((v) => {
                      const active = v.id === variantId
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => setVariantId(v.id)}
                          style={[styles.swatchWrap, active && styles.swatchActive, !inStockOf(v) && { opacity: 0.35 }]}
                          accessibilityLabel={v.title}
                          testID={`swatch-${v.title}`}
                        >
                          <View style={[styles.swatch, { backgroundColor: swatchFor(v)! }]} />
                        </Pressable>
                      )
                    })}
                  </View>
                  {variant && swatchFor(variant) ? <Text style={styles.optValue}>{variant.title}</Text> : null}
                </View>
              ) : null}
              {sizeVariants.length ? (
                <View style={{ gap: 12, flex: colorVariants.length ? 0 : 1 }}>
                  <Text style={styles.optLabel}>الحجم</Text>
                  <View style={styles.optRow}>
                    {sizeVariants.map((v) => {
                      const active = v.id === variantId
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => setVariantId(v.id)}
                          style={[styles.size, active && styles.sizeActive, !inStockOf(v) && { opacity: 0.4 }]}
                          testID={`size-${v.title}`}
                        >
                          <Text style={[styles.sizeText, active && { color: COLORS.onStrong }]} numberOfLines={1}>
                            {v.title}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          <Collapsible title="الوصف" open={open.includes("description")} onToggle={() => toggle("description")} testID="tab-description">
            <Text style={styles.body} numberOfLines={more || !longText ? undefined : 4}>
              {description || "-"}
            </Text>
            {longText && !more ? (
              <Pressable onPress={() => setMore(true)}>
                <Text style={styles.readMore}>اقرأ المزيد</Text>
              </Pressable>
            ) : null}
          </Collapsible>
          {howTo ? (
            <Collapsible title="طريقة الاستخدام" open={open.includes("how")} onToggle={() => toggle("how")} testID="tab-how">
              <Text style={styles.body}>{howTo}</Text>
            </Collapsible>
          ) : null}
          {ingredients ? (
            <Collapsible title="المكونات" open={open.includes("ingredients")} onToggle={() => toggle("ingredients")} testID="tab-ingredients">
              <Text style={styles.body}>{ingredients}</Text>
            </Collapsible>
          ) : null}
          <Collapsible title="التقييمات" open={open.includes("reviews")} onToggle={() => toggle("reviews")} testID="tab-reviews">
            <ReviewsPanel data={reviews} onWrite={() => router.push("/orders")} />
          </Collapsible>
          {similar.length ? (
            <Collapsible title="منتجات مشابهة" open={open.includes("similar")} onToggle={() => toggle("similar")} testID="tab-similar">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}>
                {similar.map((p) => (
                  <ProductCard key={p.id} product={p} variant="featured" />
                ))}
              </ScrollView>
            </Collapsible>
          ) : null}
        </View>
      </ScrollView>

      {/* Full-width dark "add to cart" bar */}
      <Pressable
        style={[styles.addBar, { paddingBottom: 18 + insets.bottom }, (!inStock || loading) && { backgroundColor: "#6b6b6b" }]}
        disabled={!inStock || loading}
        onPress={onAdd}
        testID="add-to-cart"
      >
        {loading ? (
          <ActivityIndicator color={COLORS.onPrimary} />
        ) : (
          <View style={styles.addRow}>
            <Icon name="shopping-bag" size={20} color={COLORS.onPrimary} />
            <Text style={styles.addText}>{inStock ? "أضيفي للسلة" : "نفد من المخزون"}</Text>
          </View>
        )}
      </Pressable>
    </View>
  )
}

/** Average out of 5, star bars with percentages, and the latest reviews (design: "Reviews"). */
function ReviewsPanel({ data, onWrite }: { data: { summary: ReviewSummary; reviews: Review[] } | null; onWrite: () => void }) {
  if (!data) return <ActivityIndicator color={COLORS.primary} />
  const total = data.summary.count
  return (
    <View style={{ gap: 18 }} testID="reviews-panel">
      {total ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={{ fontSize: 34, fontWeight: "700" }}>{data.summary.average.toFixed(1)}</Text>
              <Text style={{ fontSize: 11, color: COLORS.muted }}>من 5</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <Stars value={data.summary.average} size={17} gap={2} />
              <Text style={{ fontSize: 11, color: COLORS.muted }}>{`${total} تقييم`}</Text>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            {data.summary.distribution.map((d) => {
              const pct = Math.round((d.count / total) * 100)
              return (
                <View key={d.star} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 11, width: 26, color: COLORS.muted }}>{`${d.star} `}<Text style={{ color: COLORS.accent, fontSize: 11 }}>★</Text></Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.muted, width: 32, textAlign: "right" }}>{`${pct}%`}</Text>
                </View>
              )
            })}
          </View>
        </>
      ) : (
        <Text style={styles.body}>لا توجد تقييمات بعد.</Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: COLORS.muted }}>{`${total} مراجعة`}</Text>
        <Pressable onPress={onWrite} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 12, color: COLORS.muted }}>اكتبي تقييمك</Text>
          <Icon name="edit-2" size={13} color={COLORS.muted} />
        </Pressable>
      </View>
      {data.reviews.map((r) => (
        <View key={r.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.avatar}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{r.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: "700", fontSize: 14 }}>{r.name}</Text>
              <Stars value={r.rating} size={12} gap={2} />
            </View>
            <Text style={{ fontSize: 11, color: COLORS.muted }}>{timeAgo(r.created_at)}</Text>
          </View>
          {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
          {r.images?.length ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {r.images.map((u) => (
                <Image key={u} source={u} style={styles.reviewImg} contentFit="cover" />
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: "center", marginTop: 80, color: COLORS.muted },
  hero: { backgroundColor: "#fdf7f4", overflow: "hidden" },
  heroCircle: { position: "absolute", alignSelf: "center", width: 250, height: 250, borderRadius: 125, backgroundColor: "#f7e9e2" },
  heroIcon: { flex: 1, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", bottom: 38, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#3a3a3a" },
  dotOn: { width: 10, height: 10, borderRadius: 5, backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#3a3a3a" },
  topBar: { position: "absolute", left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" },
  heartBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.12, elevation: 3 },
  sheet: { marginTop: -26, backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 30, ...SHADOW, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06 },
  titleRow: { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#ececec" },
  title: { fontSize: 18, fontWeight: "700", lineHeight: 27 },
  price: { fontSize: 22, fontWeight: "700" },
  old: { fontSize: 12, color: "#b5b5b9", textDecorationLine: "line-through", marginTop: 2 },
  options: { flexDirection: "row", gap: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#ececec" },
  optLabel: { fontSize: 14, color: "#8a8a8f" },
  optValue: { fontSize: 12, color: COLORS.muted },
  optRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
  swatchWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  swatchActive: { backgroundColor: "#fff", ...SHADOW, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  size: { minWidth: 36, height: 36, borderRadius: 18, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.soft },
  sizeActive: { backgroundColor: COLORS.strong },
  sizeText: { fontSize: 12, color: "#8a8a8f", fontWeight: "700" },
  section: { borderBottomWidth: 1, borderBottomColor: "#ececec" },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 58 },
  sectionTitle: { fontSize: 17, fontWeight: "500" },
  body: { fontSize: 13, lineHeight: 22, color: "#5a5a5e" },
  readMore: { color: COLORS.accent, textDecorationLine: "underline", fontSize: 13, marginTop: 4 },
  barTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "#f1f1f1", overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: COLORS.accent, borderRadius: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#c9a99a", alignItems: "center", justifyContent: "center" },
  reviewText: { fontSize: 13, lineHeight: 21, color: "#5a5a5e" },
  reviewImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: COLORS.soft },
  addBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.primary, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 22, alignItems: "center" },
  addRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  addText: { color: COLORS.onPrimary, fontSize: 17, fontWeight: "700" },
})

/** Styles of the "natural" theme product page */
const n = StyleSheet.create({
  round: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.06 },
  hero: { alignSelf: "center", height: 270, borderRadius: 24, overflow: "hidden", backgroundColor: COLORS.card },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#cfd1ca" },
  dotOn: { width: 20, backgroundColor: COLORS.dark },
  kind: { fontSize: 12, color: COLORS.muted },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  title: { flex: 1, fontSize: 19, fontWeight: "700", lineHeight: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  logo: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  logoText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 13 },
  brandName: { fontSize: 14, fontWeight: "700" },
  brandSub: { fontSize: 11, color: COLORS.muted },
  follow: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: COLORS.dark },
  followText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 8 },
  label: { fontSize: 12, color: COLORS.muted },
  optRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  size: { height: 38, borderRadius: 10, paddingHorizontal: 14, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  sizeOn: { backgroundColor: COLORS.primary },
  sizeText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  swatchWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: COLORS.primary },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  qty: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.card, borderRadius: 12, padding: 4 },
  qtyBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  qtyText: { fontWeight: "700", minWidth: 18, textAlign: "center" },
  buyBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 76,
    borderRadius: 26,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingStart: 20,
    paddingEnd: 10,
    ...SHADOW,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
  },
  totalLabel: { fontSize: 11, color: COLORS.muted },
  total: { fontSize: 20, fontWeight: "700" },
  add: { flexDirection: "row", alignItems: "center", gap: 8, height: 54, borderRadius: 27, paddingHorizontal: 22, backgroundColor: COLORS.primary },
  addText: { color: COLORS.onPrimary, fontSize: 15, fontWeight: "700" },
})
