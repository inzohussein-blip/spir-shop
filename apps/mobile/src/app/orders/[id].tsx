import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Header from "../../components/Header"
import Text from "../../components/Text"
import { AppOrder, getOrders } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS, RADIUS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { trackingCode } from "../../lib/order-labels"
import { useStore } from "../../lib/store"

const BANNER: Record<string, { title: string; icon: string }> = {
  placed: { title: "استلمنا طلبك", icon: "clipboard-check-outline" },
  confirmed: { title: "تم تأكيد طلبك", icon: "phone-check-outline" },
  shipped: { title: "طلبك مع المندوب", icon: "truck-delivery-outline" },
  delivered: { title: "تم تسليم طلبك", icon: "hand-heart-outline" },
  canceled: { title: "تم إلغاء الطلب", icon: "close-circle-outline" },
}

/** Order details (design: "order info"): status banner, order info, items and totals, actions. */
export default function OrderInfo() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { settings, features } = useStore()
  const { addItem } = useCart()
  const [order, setOrder] = useState<AppOrder | null | undefined>(undefined)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    getOrders([id])
      .then((o) => setOrder(o[0] ?? null))
      .catch(() => setOrder(null))
  }, [id])

  if (order === undefined)
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header title="الطلب" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    )
  if (!order)
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header title="الطلب" />
        <Text style={{ textAlign: "center", marginTop: 40 }}>الطلب غير موجود</Text>
      </View>
    )

  const delivered = order.current === "delivered"
  const canceled = order.current === "canceled"
  const banner = BANNER[order.current]
  const eta = order.shipping_address?.province === "بغداد" ? settings.baghdad_eta : settings.provinces_eta
  const firstToRate = order.items[0]

  const reorder = async () => {
    setReordering(true)
    try {
      for (const it of order.items) if (it.variant_id) await addItem(it.variant_id, it.quantity)
      router.push("/cart")
    } catch {
      const handle = order.items[0]?.product_handle
      if (handle) router.push(`/product/${handle}`)
    } finally {
      setReordering(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.pageAlt }}>
      <Header title={`طلب #${order.display_id}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 26 }}>
        <View style={[styles.banner, canceled && { backgroundColor: COLORS.danger }]} testID="order-banner">
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSub}>
              {delivered ? (features.reviews ? "قيّمي المنتجات وساعدي غيرك يختار." : "شكراً لتسوقك معنا.") : canceled ? "تواصلي معنا إذا عندك أي استفسار." : `يوصلك ${eta} • الدفع عند الاستلام`}
            </Text>
          </View>
          <MaterialCommunityIcons name={banner.icon as never} size={48} color="#fff" />
        </View>

        <View style={styles.card}>
          <Row label="رقم الطلب" value={`#${order.display_id}`} />
          <Row label="رمز التتبع" value={trackingCode(order.id)} />
          <Row
            label="عنوان التوصيل"
            value={[order.shipping_address?.province, order.shipping_address?.city, order.shipping_address?.address_1].filter(Boolean).join("، ")}
          />
        </View>

        <View style={[styles.card, { paddingVertical: 18, gap: 14 }]}>
          {order.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={2}>
                {it.product_title || it.title}
              </Text>
              <Text style={styles.itemQty}>{`x${it.quantity}`}</Text>
              <Text style={styles.itemPrice}>{formatIqd(it.unit_price * it.quantity)}</Text>
            </View>
          ))}
          <View style={{ marginTop: 10, gap: 8 }}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>المجموع الفرعي</Text>
              <Text style={styles.sumValue}>{formatIqd(order.item_total)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>التوصيل</Text>
              <Text style={styles.sumValue}>{order.shipping_total ? formatIqd(order.shipping_total) : "مجاني"}</Text>
            </View>
          </View>
          <View style={[styles.sumRow, styles.totalRow]}>
            <Text style={{ fontSize: 15 }}>المجموع</Text>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{formatIqd(order.total)}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => (delivered || canceled ? router.replace("/") : reorder())} testID="order-secondary">
            <Text style={{ fontSize: 15, color: "#6b6b8a" }}>{delivered || canceled ? "العودة للرئيسية" : reordering ? "..." : "اطلبيه مرة ثانية"}</Text>
          </Pressable>
          {delivered && firstToRate && features.reviews ? (
            <Pressable
              style={[styles.btn, styles.btnDark]}
              onPress={() => router.push({ pathname: "/rate", params: { product_id: firstToRate.product_id, order_id: order.id, title: firstToRate.product_title || firstToRate.title } })}
              testID={`rate-${firstToRate.product_id}`}
            >
              <Text style={styles.btnDarkText}>تقييم</Text>
            </Pressable>
          ) : !canceled ? (
            <Pressable style={[styles.btn, styles.btnDark]} onPress={() => router.push(`/track/${order.id}`)} testID="open-tracking">
              <Text style={styles.btnDarkText}>تتبّع الطلب</Text>
            </Pressable>
          ) : null}
        </View>
        {delivered ? (
          <Pressable onPress={() => router.push(`/track/${order.id}`)} style={{ alignSelf: "center" }} testID="open-tracking">
            <Text style={{ color: COLORS.muted, textDecorationLine: "underline", fontSize: 13 }}>عرض مراحل التوصيل</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: COLORS.banner, borderRadius: RADIUS.card - 8, paddingHorizontal: 30, paddingVertical: 24 },
  bannerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  bannerSub: { color: "#fff", fontSize: 12, opacity: 0.9 },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.card - 8, paddingHorizontal: 18, paddingVertical: 8, ...SHADOW, shadowOpacity: 0.06 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: "#8a8a8f" },
  infoValue: { flex: 1, fontSize: 13, textAlign: "right" },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemName: { flex: 1, fontSize: 14 },
  itemQty: { fontSize: 14, color: "#5a5a5e", width: 32, textAlign: "center" },
  itemPrice: { fontSize: 14, fontWeight: "700", minWidth: 80, textAlign: "right" },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sumLabel: { fontSize: 14 },
  sumValue: { fontSize: 14, fontWeight: "700" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#ececec", paddingTop: 14, marginTop: 6 },
  btn: { flex: 1, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  btnOutline: { borderWidth: 1, borderColor: "#6b6b8a" },
  btnDark: { backgroundColor: COLORS.primary },
  btnDarkText: { color: COLORS.onPrimary, fontSize: 16, fontWeight: "700" },
})
