import { Image } from "expo-image"
import { useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../../components/Button"
import Icon from "../../../components/Icon"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, ErrorBox, Loading, StatusPill } from "../../../components/admin/ui"
import { adminFetch, AdminOrder } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { confirmAsk } from "../../../lib/confirm"
import { formatIqd } from "../../../lib/format"

/** Iraqi number "0770..." -> "964770..." for WhatsApp links. */
const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "")
  return d.startsWith("964") ? d : d.startsWith("0") ? `964${d.slice(1)}` : d
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ar-IQ", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })

/** The next step a manager takes, by status. */
const NEXT: Record<string, { action: "confirm" | "ship" | "deliver"; label: string; ask: string } | undefined> = {
  placed: { action: "confirm", label: "تأكيد الطلب (تم الاتصال بالزبون)", ask: "تأكيد الطلب؟ يوصل إشعار للزبون." },
  confirmed: { action: "ship", label: "تسليم للمندوب", ask: "تم تسليم الطلب للمندوب؟ يوصل إشعار للزبون." },
  shipped: { action: "deliver", label: "تم التسليم للزبون", ask: "الزبون استلم الطلب؟" },
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      setOrder((await adminFetch<{ order: AdminOrder }>(`/admin/app-orders/${id}`)).order)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: string, ask: string) => {
    if (!(await confirmAsk(ask))) return
    setBusy(action)
    setError(null)
    try {
      setOrder((await adminFetch<{ order: AdminOrder }>(`/admin/app-orders/${id}/${action}`, { method: "POST", body: {} })).order)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (!order) {
    return (
      <View style={adminStyles.page}>
        <AdminHeader title="الطلب" back />
        {error ? (
          <View style={{ padding: 16 }}>
            <ErrorBox message={error} onRetry={load} />
          </View>
        ) : (
          <Loading />
        )}
      </View>
    )
  }

  const a = order.shipping_address ?? {}
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ")
  const next = NEXT[order.current]
  const canCancel = order.current === "placed" || order.current === "confirmed"

  return (
    <View style={adminStyles.page}>
      <AdminHeader title={`طلب #${order.display_id}`} back />
      <ScrollView contentContainerStyle={adminStyles.content}>
        {error ? <ErrorBox message={error} /> : null}

        <Card>
          <View style={adminStyles.rowBetween}>
            <Text style={adminStyles.title}>{name || "زبون"}</Text>
            <StatusPill status={order.current} />
          </View>
          <Text style={[adminStyles.muted, { marginTop: 6 }]}>{[a.province, a.city, a.address_1, a.address_2].filter(Boolean).join("، ")}</Text>
          {order.shipping_methods?.[0]?.name ? <Text style={adminStyles.muted}>التوصيل: {order.shipping_methods[0].name}</Text> : null}
          {a.phone ? (
            <View style={styles.contact}>
              <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${a.phone}`)}>
                <Icon name="phone" size={18} color={COLORS.onPrimary} />
                <Text style={styles.contactText}>اتصال</Text>
              </Pressable>
              <Pressable style={[styles.contactBtn, { backgroundColor: "#25a244" }]} onPress={() => Linking.openURL(`https://wa.me/${waNumber(a.phone!)}`)}>
                <Icon name="message-circle" size={18} color="#fff" />
                <Text style={[styles.contactText, { color: "#fff" }]}>واتساب</Text>
              </Pressable>
              <Text style={{ flex: 1, textAlign: "left", fontWeight: "700" }} selectable>
                {a.phone}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={adminStyles.title}>المنتجات</Text>
          {(order.items ?? []).map((i) => (
            <View key={i.id} style={styles.item}>
              <Image source={i.thumbnail ?? undefined} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }} numberOfLines={2}>
                  {i.product_title ?? i.title}
                </Text>
                {i.variant_title && i.variant_title !== "افتراضي" ? <Text style={adminStyles.muted}>{i.variant_title}</Text> : null}
                <Text style={adminStyles.muted}>
                  {i.quantity} × {formatIqd(i.unit_price)}
                </Text>
              </View>
              <Text style={{ fontWeight: "700" }}>{formatIqd(i.quantity * i.unit_price)}</Text>
            </View>
          ))}
          <View style={styles.line} />
          <View style={adminStyles.rowBetween}>
            <Text style={adminStyles.muted}>المنتجات</Text>
            <Text>{formatIqd(order.item_total)}</Text>
          </View>
          <View style={adminStyles.rowBetween}>
            <Text style={adminStyles.muted}>التوصيل</Text>
            <Text>{formatIqd(order.shipping_total)}</Text>
          </View>
          {order.discount_total ? (
            <View style={adminStyles.rowBetween}>
              <Text style={adminStyles.muted}>الخصم</Text>
              <Text>-{formatIqd(order.discount_total)}</Text>
            </View>
          ) : null}
          <View style={adminStyles.rowBetween}>
            <Text style={{ fontWeight: "700" }}>المجموع (الدفع عند الاستلام)</Text>
            <Text style={{ fontWeight: "700", fontSize: 17 }}>{formatIqd(order.total)}</Text>
          </View>
        </Card>

        <Card style={{ gap: 10 }}>
          <Text style={adminStyles.title}>مراحل الطلب</Text>
          {order.steps.map((s) => (
            <View key={s.key} style={styles.step}>
              <Icon name={s.at ? "check-circle" : "circle"} size={18} color={s.at ? COLORS.accent : "#c4c4c8"} />
              <Text style={{ flex: 1, color: s.at ? COLORS.text : COLORS.muted }}>{s.label}</Text>
              {s.at ? <Text style={adminStyles.muted}>{fmtDate(s.at)}</Text> : null}
            </View>
          ))}
        </Card>

        {next ? <Button label={next.label} onPress={() => run(next.action, next.ask)} loading={busy === next.action} disabled={!!busy} testID="order-next" /> : null}
        {canCancel ? (
          <Button label="إلغاء الطلب" variant="outline" onPress={() => run("cancel", "إلغاء هذا الطلب؟ لا يمكن التراجع.")} loading={busy === "cancel"} disabled={!!busy} />
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  contact: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 18, paddingHorizontal: 14, height: 36 },
  contactText: { color: COLORS.onPrimary, fontWeight: "700", fontSize: 13 },
  item: { flexDirection: "row", gap: 10, alignItems: "center" },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: COLORS.soft },
  line: { height: 1, backgroundColor: COLORS.border },
  step: { flexDirection: "row", alignItems: "center", gap: 10 },
})
