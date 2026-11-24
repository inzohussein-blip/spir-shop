import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Header from "../../components/Header"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { ShippingOption } from "../../lib/api"
import { SavedLine, useCart } from "../../lib/cart"
import { COLORS, SHADOW, TAB_SPACE } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { useStore } from "../../lib/store"

type Line = { key: string; title: string; detail: string; thumbnail: string | null; price: number; qty: number; ticked: boolean; lineId?: string; variantId: string }

function Checkbox({ on, onPress, testID }: { on: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[styles.box, on ? styles.boxOn : styles.boxOff]} testID={testID}>
      <Icon name="check" size={14} color="#fff" />
    </Pressable>
  )
}

/** Your cart (design: "your cart"): ticked products, quantity pills, totals panel, checkout button. */
export default function CartScreen() {
  const { cart, updateItem, removeItem, listShippingOptions, loading, saved, untick, tick } = useCart()
  const { address } = useStore()
  const router = useRouter()
  const [shipping, setShipping] = useState<ShippingOption | null>(null)

  const items = cart?.items ?? []
  useEffect(() => {
    if (!items.length) return setShipping(null)
    listShippingOptions()
      .then((opts) => {
        const wanted = (address?.province ?? "بغداد") === "بغداد" ? "بغداد" : "المحافظات"
        setShipping(opts.find((o) => o.name.includes(wanted)) ?? opts[0] ?? null)
      })
      .catch(() => undefined)
  }, [cart?.id, cart?.item_total, address?.province]) // eslint-disable-line react-hooks/exhaustive-deps

  const lines: Line[] = [
    ...items.map((i) => ({
      key: i.id,
      lineId: i.id,
      variantId: i.variant_id ?? "",
      title: i.product_title ?? i.title,
      detail: i.variant_title && !["Default", "قياسي"].includes(i.variant_title) ? i.variant_title : "",
      thumbnail: i.thumbnail,
      price: i.unit_price,
      qty: i.quantity,
      ticked: true,
    })),
    ...saved.map((s: SavedLine) => ({
      key: `saved-${s.variant_id}`,
      variantId: s.variant_id,
      title: s.product_title ?? s.title,
      detail: s.variant_title && !["Default", "قياسي"].includes(s.variant_title) ? s.variant_title : "",
      thumbnail: s.thumbnail,
      price: s.unit_price,
      qty: s.quantity,
      ticked: false,
    })),
  ]

  const itemsTotal = cart?.item_subtotal ?? cart?.subtotal ?? 0
  const discount = cart?.discount_total ?? 0
  const fee = shipping?.amount ?? null
  const total = (cart?.item_total ?? itemsTotal) + (fee ?? 0)

  if (!lines.length) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header title="سلتك" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="shopping-bag" size={40} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>سلتك فارغة</Text>
          <Text style={{ color: COLORS.muted }}>أضيفي منتجاتك المفضلة وراح تظهر هنا</Text>
          <Button label="تسوّقي الآن" onPress={() => router.push("/")} style={{ alignSelf: "stretch", marginTop: 12 }} />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header title="سلتك" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 24, gap: 20 }}>
        {lines.map((l) => (
          <View key={l.key} style={[styles.card, !l.ticked && { opacity: 0.6 }]} testID="cart-item">
            <View style={styles.thumb}>
              {l.thumbnail ? <Image source={l.thumbnail} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            </View>
            <View style={styles.info}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {l.title}
                </Text>
                <Checkbox on={l.ticked} onPress={() => (l.ticked ? untick(l.lineId!) : tick(l.variantId))} testID={`tick-${l.key}`} />
              </View>
              <Text style={styles.price}>{formatIqd(l.price)}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.detail} numberOfLines={1}>
                  {l.detail ? `الدرجة: ${l.detail}` : ""}
                </Text>
                <View style={styles.qty}>
                  <Pressable
                    disabled={!l.ticked || loading}
                    onPress={() => (l.qty > 1 ? updateItem(l.lineId!, l.qty - 1) : removeItem(l.lineId!))}
                    hitSlop={8}
                    testID="qty-minus"
                  >
                    <Icon name="minus" size={13} />
                  </Pressable>
                  <Text style={styles.qtyText}>{l.qty}</Text>
                  <Pressable disabled={!l.ticked || loading} onPress={() => updateItem(l.lineId!, l.qty + 1)} hitSlop={8} testID="qty-plus">
                    <Icon name="plus" size={13} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>سعر المنتجات</Text>
          <Text style={styles.sumValue}>{formatIqd(itemsTotal)}</Text>
        </View>
        {discount > 0 ? (
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>الخصم</Text>
            <Text style={[styles.sumValue, { color: COLORS.accent }]}>- {formatIqd(discount)}</Text>
          </View>
        ) : null}
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>التوصيل</Text>
          <Text style={styles.sumValue} testID="cart-shipping">
            {fee == null ? "—" : fee === 0 ? "مجاني" : formatIqd(fee)}
          </Text>
        </View>
        <View style={[styles.sumRow, { borderBottomWidth: 0 }]}>
          <Text style={{ fontSize: 15 }}>المجموع</Text>
          <Text style={{ fontSize: 20, fontWeight: "700" }} testID="cart-total">
            {formatIqd(total)}
          </Text>
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{ position: "absolute", top: 8, alignSelf: "center" }} /> : null}
        <Button label="متابعة الطلب" onPress={() => router.push("/checkout")} disabled={!items.length} testID="go-checkout" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, height: 100, ...SHADOW, shadowOpacity: 0.08, elevation: 3 },
  thumb: { width: 98, height: 100, backgroundColor: "#f6f1ee", borderTopStartRadius: 12, borderBottomStartRadius: 12, overflow: "hidden" },
  info: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, justifyContent: "space-between" },
  title: { flex: 1, fontSize: 13, fontWeight: "700" },
  price: { fontSize: 15, fontWeight: "700" },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detail: { flex: 1, fontSize: 11, color: "#a5a5a9" },
  qty: { flexDirection: "row", alignItems: "center", gap: 12, height: 26, paddingHorizontal: 10, borderRadius: 13, borderWidth: 1, borderColor: "#6b6b6b" },
  qtyText: { fontSize: 12, fontWeight: "700", minWidth: 10, textAlign: "center" },
  box: { width: 20, height: 20, borderRadius: 3, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: COLORS.accent },
  boxOff: { backgroundColor: "#c4c4c4" },
  summary: {
    backgroundColor: COLORS.card,
    marginBottom: TAB_SPACE,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOW,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    elevation: 6,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  sumLabel: { color: "#9b9b9b", fontSize: 14 },
  sumValue: { fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
})
