import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { ReactNode, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Icon, { CategoryIcon } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { getProduct, listProducts, Product, Variant } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"

/** Collapsible section with a chevron, as in the design ("Description", "Reviews"...). */
function Section({ title, children, initiallyOpen = true }: { title: string; children: ReactNode; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHead} onPress={() => setOpen(!open)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={20} />
      </Pressable>
      {open ? <View style={{ paddingBottom: 18 }}>{children}</View> : null}
    </View>
  )
}

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { addItem, loading } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [similar, setSimilar] = useState<Product[]>([])
  const [variantId, setVariantId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getProduct(handle)
      .then((p) => {
        setProduct(p)
        if (p?.variants.length) setVariantId(p.variants[0].id)
        const categoryId = p?.categories?.[0]?.id
        listProducts({ categoryId, limit: 8 })
          .then((list) => setSimilar(list.filter((x) => x.id !== p?.id)))
          .catch(() => undefined)
      })
      .catch(() => setError(true))
  }, [handle])

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"))

  if (error) return <Text style={styles.center}>تعذّر تحميل المنتج</Text>
  if (!product) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />

  const variant = product.variants.find((v) => v.id === variantId)
  const inStock = !variant?.manage_inventory || variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
  const image = product.thumbnail || product.images?.[0]?.url

  // Color swatches: product.metadata.swatches = { "<option value>": "#hex" }
  const swatches = product.metadata?.swatches ?? {}
  const swatchFor = (v: Variant) => {
    const value = v.options?.map((o) => o.value).find((val) => swatches[val]) ?? v.title
    const hex = swatches[value]
    return typeof hex === "string" && /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : null
  }
  const hasSwatches = product.variants.some((v) => swatchFor(v))

  const onAdd = async () => {
    if (!variant) return
    try {
      await addItem(variant.id)
      router.push("/cart")
    } catch (e) {
      Alert.alert("خطأ", (e as Error).message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        <View style={styles.hero}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.heroCircle}>
              <CategoryIcon name={product.categories?.[0]?.name ?? ""} size={72} color={COLORS.muted} />
            </View>
          )}
          <Pressable
            style={[styles.roundBtn, { top: insets.top + 12, start: 20 }]}
            onPress={back}
            accessibilityLabel="رجوع"
            testID="product-back"
          >
            {/* In RTL "back" points to the right */}
            <Icon name="chevron-right" size={20} />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>{formatIqd(variant?.calculated_price?.calculated_amount)}</Text>
          </View>
          <Text style={[styles.stock, !inStock && { color: COLORS.danger }]}>{inStock ? "متوفر" : "نفد من المخزون"}</Text>

          {product.variants.length > 1 && (
            <View style={styles.optionBlock}>
              <Text style={styles.optionLabel}>
                {hasSwatches ? `الدرجة: ${variant?.title ?? ""}` : "الحجم"}
              </Text>
              <View style={styles.variants}>
                {product.variants.map((v) => {
                  const color = swatchFor(v)
                  const active = v.id === variantId
                  return color ? (
                    <Pressable
                      key={v.id}
                      onPress={() => setVariantId(v.id)}
                      style={[styles.swatchRing, active && styles.swatchRingActive]}
                      accessibilityLabel={v.title}
                      testID={`swatch-${v.title}`}
                    >
                      <View style={[styles.swatch, { backgroundColor: color }]} />
                    </Pressable>
                  ) : (
                    <Pressable
                      key={v.id}
                      onPress={() => setVariantId(v.id)}
                      style={[styles.size, active && styles.sizeActive]}
                      testID={`size-${v.title}`}
                    >
                      <Text style={[styles.sizeText, active && { color: "#fff" }]}>{v.title}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {!!product.description && (
            <Section title="الوصف">
              <Text style={styles.body}>{product.description}</Text>
            </Section>
          )}

          <Section title="التوصيل والدفع" initiallyOpen={false}>
            <View style={{ gap: 12 }}>
              <View style={styles.perk}>
                <Icon name="truck" size={18} color={COLORS.accent} />
                <Text style={styles.body}>بغداد خلال 24 ساعة، وباقي المحافظات خلال 2-3 أيام</Text>
              </View>
              <View style={styles.perk}>
                <Icon name="credit-card" size={18} color={COLORS.accent} />
                <Text style={styles.body}>الدفع نقداً عند الاستلام</Text>
              </View>
              <View style={styles.perk}>
                <Icon name="refresh-cw" size={18} color={COLORS.accent} />
                <Text style={styles.body}>استبدال المنتج التالف أو غير المطابق مجاناً</Text>
              </View>
            </View>
          </Section>

          {similar.length > 0 && (
            <Section title="منتجات مشابهة">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similar.map((p) => (
                  <View key={p.id} style={{ width: 140 }}>
                    <ProductCard product={p} />
                  </View>
                ))}
              </ScrollView>
            </Section>
          )}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.addBar, { paddingBottom: 18 + insets.bottom }, (!inStock || loading) && { opacity: 0.6 }]}
        disabled={!inStock || loading}
        onPress={onAdd}
        testID="add-to-cart"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="shopping-bag" size={20} color="#fff" />
            <Text style={styles.addText}>{inStock ? "أضف إلى السلة" : "نفد من المخزون"}</Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: "center", marginTop: 80 },
  hero: { height: 420, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  heroCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  roundBtn: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW,
  },
  sheet: {
    marginTop: -30,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { flex: 1, fontSize: 20, fontWeight: "700", lineHeight: 28 },
  price: { fontSize: 22, fontWeight: "700" },
  stock: { fontSize: 12, color: COLORS.accent, marginTop: 6 },
  optionBlock: { gap: 12, paddingVertical: 18, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 18 },
  optionLabel: { fontSize: 14, color: COLORS.muted },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: "transparent" },
  swatchRingActive: { borderColor: COLORS.primary },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  size: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeActive: { backgroundColor: COLORS.primary },
  sizeText: { fontSize: 13, color: COLORS.muted, fontWeight: "500" },
  section: { borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 13, color: COLORS.text, lineHeight: 22, flex: 1 },
  perk: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  addText: { color: "#fff", fontSize: 17, fontWeight: "700" },
})
