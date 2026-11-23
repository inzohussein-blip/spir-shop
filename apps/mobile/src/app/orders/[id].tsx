import { Image } from "expo-image"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { AppOrder, getOrders } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"
import { useStore } from "../../lib/store"
import { STATUS_LABEL } from "../../lib/order-labels"

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ar-IQ", { weekday: "long", hour: "numeric", minute: "2-digit" })

/** Order tracking: status card, timeline, items (rate after delivery), contact and reorder. */
export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { settings } = useStore()
  const { addItem } = useCart()
  const [order, setOrder] = useState<AppOrder | null | undefined>(undefined)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    getOrders([id])
      .then((o) => setOrder(o[0] ?? null))
      .catch(() => setOrder(null))
  }, [id])

  if (order === undefined) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
  if (!order) return <Text style={{ textAlign: "center", marginTop: 40 }}>الطلب غير موجود</Text>

  const st = STATUS_LABEL[order.current]
  const canceled = order.current === "canceled"
  const delivered = order.current === "delivered"
  const contactUrl = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(`استفسار عن الطلب #${order.display_id}`)}`
    : settings.telegram_username
      ? `https://t.me/${settings.telegram_username.replace(/^@/, "")}`
      : settings.support_phone
        ? `tel:${settings.support_phone}`
        : null

  /** One tap: add the same variants and quantities to the cart again. */
  const reorder = async () => {
    setReordering(true)
    try {
      for (const it of order.items) {
        if (it.variant_id) await addItem(it.variant_id, it.quantity)
      }
      router.push("/cart")
    } catch {
      // A product may be out of stock or removed: open it so the customer can pick another shade
      const handle = order.items[0]?.product_handle
      if (handle) router.push(`/product/${handle}`)
    } finally {
      setReordering(false)
    }
  }

  return (
    <ScrollView style={{ backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Stack.Screen options={{ title: `طلب #${order.display_id}` }} />
      <View style={[styles.hero, canceled && { backgroundColor: COLORS.danger }]}>
        <Text style={styles.heroSmall}>الحالة</Text>
        <Text style={styles.heroTitle}>{canceled ? "تم إلغاء الطلب" : st.text}</Text>
        {!canceled && !delivered ? (
          <Text style={styles.heroSub}>
            {order.shipping_address?.province === "بغداد" ? settings.baghdad_eta : settings.provinces_eta} • الدفع عند الاستلام
          </Text>
        ) : null}
      </View>

      {!canceled ? (
        <View testID="order-timeline">
          {order.steps.map((s, i) => {
            const done = !!s.at
            const isCurrent = s.key === order.current
            const last = i === order.steps.length - 1
            return (
              <View key={s.key} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={[styles.stepDot, done && styles.stepDone, isCurrent && !delivered && styles.stepCurrent]}>
                    <Icon name={done ? "check" : "circle"} size={13} color={done ? "#fff" : "#c4c4c4"} />
                  </View>
                  {!last ? <View style={[styles.stepLine, done && order.steps[i + 1]?.at ? styles.stepLineDone : null]} /> : null}
                </View>
                <View style={{ paddingBottom: last ? 0 : 22, flex: 1 }}>
                  <Text style={[styles.stepLabel, !done && { color: COLORS.muted }]}>{s.label}</Text>
                  {s.at ? <Text style={styles.stepAt}>{fmt(s.at)}</Text> : null}
                </View>
              </View>
            )
          })}
        </View>
      ) : null}

      <View style={styles.box}>
        <View style={styles.boxRow}>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>المبلغ عند الاستلام</Text>
          <Text style={{ fontWeight: "700", fontSize: 17 }}>{formatIqd(order.total)}</Text>
        </View>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          {[order.shipping_address?.province, order.shipping_address?.city, order.shipping_address?.address_1].filter(Boolean).join("، ")}
        </Text>
        {order.items.map((it) => (
          <View key={it.id} style={styles.item}>
            <View style={styles.thumb}>{it.thumbnail ? <Image source={it.thumbnail} style={{ width: "100%", height: "100%" }} /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700" }} numberOfLines={2}>
                {it.product_title || it.title}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.muted }}>
                {[it.variant_title && it.variant_title !== "قياسي" ? it.variant_title : null, `× ${it.quantity}`].filter(Boolean).join(" • ")}
              </Text>
            </View>
            {delivered ? (
              <Pressable
                style={styles.rateBtn}
                onPress={() =>
                  router.push({ pathname: "/rate", params: { product_id: it.product_id, order_id: order.id, title: it.product_title || it.title } })
                }
                testID={`rate-${it.product_id}`}
              >
                <Text style={{ fontSize: 12, color: COLORS.accent, fontWeight: "700" }}>قيّمي ★</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {delivered ? (
        <View style={styles.rateCard}>
          <Text style={{ fontSize: 22 }}>★</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>لا تنسي تقيّمين</Text>
            <Text style={{ fontSize: 12, color: COLORS.muted }}>تقييمك يساعد غيرك تختار المنتج المناسب</Text>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        {contactUrl ? (
          <View style={{ flex: 1 }}>
            <Button label="تواصلي معنا" icon="message-circle" variant="outline" onPress={() => Linking.openURL(contactUrl)} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button label="إعادة الطلب" loading={reordering} onPress={reorder} testID="reorder" />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, gap: 2 },
  heroSmall: { color: "#fff", opacity: 0.75, fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroSub: { color: "#fff", opacity: 0.9, fontSize: 13 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: { backgroundColor: COLORS.accent },
  stepCurrent: { backgroundColor: COLORS.primary },
  stepLine: { width: 2, flex: 1, minHeight: 22, backgroundColor: COLORS.border },
  stepLineDone: { backgroundColor: COLORS.accent },
  stepLabel: { fontSize: 14, fontWeight: "700" },
  stepAt: { fontSize: 12, color: COLORS.muted },
  box: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, gap: 10 },
  boxRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 10 },
  thumb: { width: 46, height: 46, borderRadius: 8, backgroundColor: COLORS.soft, overflow: "hidden" },
  rateBtn: { borderWidth: 1, borderColor: COLORS.accent, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
})
