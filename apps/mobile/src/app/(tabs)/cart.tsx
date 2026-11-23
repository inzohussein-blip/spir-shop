import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { listProducts, Product, ShippingOption } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS, FONTS, RADIUS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { useStore } from "../../lib/store"

export default function CartScreen() {
  const { cart, updateItem, removeItem, addItem, applyPromo, removePromo, listShippingOptions, loading } = useCart()
  const { settings, address } = useStore()
  const router = useRouter()
  const items = cart?.items ?? []
  const [products, setProducts] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [shipping, setShipping] = useState<ShippingOption | null>(null)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState<string | null>(null)

  const productIds = useMemo(() => [...new Set(items.map((i) => i.product_id).filter((x): x is string => !!x))], [items])

  // Product data for stock warnings and "complete your routine" suggestions
  useEffect(() => {
    if (!productIds.length) return
    listProducts({ ids: productIds, limit: 50 })
      .then(async (list) => {
        setProducts(list)
        const categoryId = list.flatMap((p) => p.categories ?? [])[0]?.id
        const pool = await listProducts({ categoryId, limit: 12 })
        setSuggestions(pool.filter((p) => !productIds.includes(p.id)).slice(0, 6))
      })
      .catch(() => undefined)
  }, [productIds.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  // Delivery price for the saved governorate (free above the threshold)
  useEffect(() => {
    if (!cart?.id || !items.length) return
    listShippingOptions()
      .then((opts) => {
        const wanted = (address?.province ?? "بغداد") === "بغداد" ? "بغداد" : "المحافظات"
        setShipping(opts.find((o) => o.name.includes(wanted)) ?? null)
      })
      .catch(() => setShipping(null))
  }, [cart?.id, cart?.item_total, address?.province]) // eslint-disable-line react-hooks/exhaustive-deps

  const stockOf = (variantId?: string) => {
    for (const p of products) {
      const v = p.variants.find((x) => x.id === variantId)
      if (v) return v.manage_inventory && !v.allow_backorder ? v.inventory_quantity ?? null : null
    }
    return null
  }

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="shopping-bag" size={40} />
        </View>
        <Text style={styles.emptyTitle}>سلتك فارغة</Text>
        <Text style={styles.emptyText}>أضيفي منتجاتك المفضلة وستظهر هنا</Text>
        <Button label="تصفّحي المنتجات" onPress={() => router.push("/")} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    )
  }

  const itemTotal = cart?.item_total ?? cart?.item_subtotal ?? cart?.subtotal ?? 0
  const discount = cart?.discount_total ?? 0
  const threshold = settings.free_shipping_threshold
  const remaining = threshold ? Math.max(0, threshold - (cart?.item_subtotal ?? itemTotal)) : 0
  const progress = threshold ? Math.min(1, (cart?.item_subtotal ?? itemTotal) / threshold) : 0
  const deliveryFee = shipping?.amount ?? null
  const total = (cart?.item_total ?? itemTotal) + (deliveryFee ?? 0)
  const promos = (cart?.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c)

  const submitCode = async () => {
    if (!code.trim()) return
    setCodeError(null)
    try {
      await applyPromo(code)
      setCode("")
    } catch {
      setCodeError("الكود غير صحيح أو منتهي")
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {threshold ? (
          <View style={styles.freeBox} testID="free-shipping-bar">
            <Text style={{ fontSize: 13 }}>
              {remaining > 0 ? (
                <>
                  باقي <Text style={{ fontWeight: "700" }}>{formatIqd(remaining)}</Text> وتحصلين{" "}
                  <Text style={{ fontWeight: "700" }}>توصيل مجاني</Text>
                </>
              ) : (
                <Text style={{ fontWeight: "700", color: COLORS.accent }}>حصلتِ على توصيل مجاني</Text>
              )}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        ) : null}

        {items.map((item) => {
          const stock = stockOf(item.variant_id)
          return (
            <View key={item.id} style={styles.card} testID="cart-item">
              <View style={styles.thumb}>
                {item.thumbnail ? <Image source={item.thumbnail} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : null}
              </View>
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.product_title || item.title}
                  </Text>
                  <Pressable onPress={() => removeItem(item.id)} disabled={loading} hitSlop={10} accessibilityLabel="حذف">
                    <Icon name="x" size={18} color={COLORS.muted} />
                  </Pressable>
                </View>
                <Text style={styles.variant} numberOfLines={1}>
                  {[item.variant_title && item.variant_title !== "قياسي" ? item.variant_title : null].filter(Boolean).join("")}
                  {stock != null && stock <= 5 ? <Text style={{ color: COLORS.danger, fontWeight: "700" }}>{`  متبقي ${stock} فقط`}</Text> : null}
                </Text>
                <View style={styles.bottomRow}>
                  <Text style={styles.price}>{formatIqd(item.total)}</Text>
                  <View style={styles.qty}>
                    <Pressable disabled={loading} onPress={() => updateItem(item.id, item.quantity + 1)} hitSlop={8} accessibilityLabel="زيادة">
                      <Icon name="plus" size={14} color="rgba(0,0,0,0.6)" />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable
                      disabled={loading}
                      onPress={() => (item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id))}
                      hitSlop={8}
                      accessibilityLabel="إنقاص"
                    >
                      <Icon name="minus" size={14} color="rgba(0,0,0,0.6)" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          )
        })}

        {/* Discount code */}
        {promos.length ? (
          promos.map((c) => (
            <View key={c} style={[styles.code, { borderStyle: "solid", borderColor: COLORS.accent }]}>
              <Icon name="tag" size={18} color={COLORS.accent} />
              <Text style={{ flex: 1, fontWeight: "700", color: COLORS.accent }}>{c}</Text>
              <Pressable onPress={() => removePromo(c)} hitSlop={8}>
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>إزالة</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.code}>
            <Icon name="tag" size={18} color={COLORS.muted} />
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="عندك كود خصم؟"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
              style={styles.codeInput}
              onSubmitEditing={submitCode}
              testID="promo-input"
            />
            <Pressable onPress={submitCode} disabled={loading} testID="promo-apply">
              <Text style={{ color: COLORS.accent, fontWeight: "700" }}>تطبيق</Text>
            </Pressable>
          </View>
        )}
        {codeError ? <Text style={{ color: COLORS.danger, fontSize: 12 }}>{codeError}</Text> : null}

        {suggestions.length ? (
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>يكمل روتينك</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {suggestions.map((p) => {
                const price = p.variants[0]?.calculated_price?.calculated_amount
                return (
                  <Pressable key={p.id} style={styles.suggest} onPress={() => router.push(`/product/${p.handle}`)}>
                    <View style={styles.suggestImg}>{p.thumbnail ? <Image source={p.thumbnail} style={{ width: "100%", height: "100%" }} /> : null}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12 }} numberOfLines={2}>
                        {p.title}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "700" }}>{formatIqd(price)}</Text>
                    </View>
                    <Pressable
                      style={styles.suggestAdd}
                      onPress={() => (p.variants.length === 1 ? addItem(p.variants[0].id) : router.push(`/product/${p.handle}`))}
                      hitSlop={6}
                      testID={`suggest-add-${p.handle}`}
                    >
                      <Icon name="plus" size={14} color="#fff" />
                    </Pressable>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>المنتجات</Text>
          <Text style={styles.sumValue}>{formatIqd(cart?.item_subtotal ?? itemTotal)}</Text>
        </View>
        {discount > 0 ? (
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>الخصم</Text>
            <Text style={[styles.sumValue, { color: COLORS.accent }]}>- {formatIqd(discount)}</Text>
          </View>
        ) : null}
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>التوصيل ({address?.province ?? "بغداد"})</Text>
          <Text style={[styles.sumValue, deliveryFee === 0 && { color: COLORS.accent, fontWeight: "700" }]}>
            {deliveryFee == null ? "—" : deliveryFee === 0 ? "مجاني" : formatIqd(deliveryFee)}
          </Text>
        </View>
        <View style={[styles.sumRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
          <Text style={{ fontSize: 14, fontWeight: "500" }}>المجموع</Text>
          <Text style={{ fontSize: 20, fontWeight: "700" }} testID="cart-total">
            {formatIqd(total)}
          </Text>
        </View>
        <Button label="إتمام الطلب" onPress={() => router.push("/checkout")} testID="go-checkout" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32, backgroundColor: COLORS.bg },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.muted },
  freeBox: { backgroundColor: "#eaf3f0", borderRadius: 12, padding: 12, gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: "#cfe3dc", overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  card: { flexDirection: "row", height: 112, backgroundColor: "#fff", borderRadius: RADIUS.card, borderWidth: 0.5, borderColor: "#fbfbfb", ...SHADOW },
  thumb: { width: 96, height: "100%", backgroundColor: COLORS.soft, borderTopStartRadius: RADIUS.card, borderBottomStartRadius: RADIUS.card, overflow: "hidden" },
  info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 13, fontWeight: "700" },
  variant: { fontSize: 11, color: COLORS.muted },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 15, fontWeight: "700" },
  qty: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.45)", borderRadius: RADIUS.pill, paddingHorizontal: 10, height: 26 },
  qtyText: { fontSize: 12, fontWeight: "700", color: "rgba(0,0,0,0.6)", minWidth: 10, textAlign: "center" },
  code: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#cfcfcf", borderRadius: 12, height: 48, paddingHorizontal: 12 },
  codeInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, textAlign: Platform.OS === "web" ? "right" : "left" },
  suggest: { flexDirection: "row", alignItems: "center", gap: 8, width: 200, backgroundColor: COLORS.surface, borderRadius: 12, padding: 6 },
  suggestImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.soft, overflow: "hidden" },
  suggestAdd: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  summary: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f3f3f3" },
  sumLabel: { fontSize: 13, color: COLORS.muted },
  sumValue: { fontSize: 13 },
})
