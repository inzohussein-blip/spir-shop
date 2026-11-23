import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import AddressForm, { EMPTY_ADDRESS, isValidPhone, normalizePhone } from "../components/AddressForm"
import Button from "../components/Button"
import Steps from "../components/Steps"
import Text from "../components/Text"
import { ShippingOption } from "../lib/api"
import { useCart } from "../lib/cart"
import { COLORS } from "../lib/config"
import { formatIqd } from "../lib/format"
import { syncPushToken } from "../lib/push"
import { SavedAddress, useStore } from "../lib/store"

export default function Checkout() {
  const router = useRouter()
  const { cart, listShippingOptions, placeOrder, loading } = useCart()
  const { address, saveAddress, addOrder } = useStore()
  const [form, setForm] = useState<SavedAddress>(address ?? EMPTY_ADDRESS)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill with the saved address once it is loaded
  useEffect(() => {
    if (address && !form.firstName && !form.phone) setForm(address)
  }, [address]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listShippingOptions().then(setOptions).catch(() => setOptions([]))
  }, [cart?.id, cart?.item_total]) // eslint-disable-line react-hooks/exhaustive-deps

  // Baghdad -> Baghdad delivery, other governorates -> provinces delivery
  useEffect(() => {
    if (!form.province || !options.length) return
    const wanted = form.province === "بغداد" ? "بغداد" : "المحافظات"
    const match = options.find((o) => o.name.includes(wanted))
    if (match) setShippingId(match.id)
  }, [form.province, options])

  const shipping = options.find((o) => o.id === shippingId)
  const subtotal = cart?.item_subtotal ?? cart?.subtotal ?? 0
  const discount = cart?.discount_total ?? 0
  const total = (cart?.item_total ?? subtotal) + (shipping?.amount ?? 0)

  const submit = async () => {
    setError(null)
    const phone = normalizePhone(form.phone)
    if (!form.firstName || !form.province || !form.city || !form.address) {
      return setError("يرجى إكمال الاسم والمحافظة والمنطقة والعنوان")
    }
    if (!isValidPhone(phone)) return setError("رقم الهاتف غير صحيح (مثال: 07701234567)")
    if (!shippingId) return setError("اختر طريقة التوصيل")
    try {
      const order = await placeOrder({ ...form, phone, email: form.email || undefined, shippingOptionId: shippingId })
      // Remember the address and the order on this device; link the device to the order for status notifications
      await saveAddress({ ...form, phone })
      await addOrder(order.id)
      syncPushToken(null, order.id)
      router.replace({
        pathname: "/order/[id]",
        params: { id: order.id, n: String(order.display_id), total: String(order.total) },
      })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!cart?.items?.length) {
    return <Text style={{ textAlign: "center", marginTop: 60 }}>السلة فارغة</Text>
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.page}>
        <Steps step={1} />
        <View>
          <Text style={styles.stepSmall}>الخطوة 1</Text>
          <Text style={styles.h1}>التوصيل</Text>
        </View>

        <AddressForm value={form} onChange={setForm} showEmail />

        <Text style={styles.h2}>طريقة التوصيل</Text>
        <View style={{ gap: 6 }}>
          {options.map((o) => {
            const active = o.id === shippingId
            return (
              <Pressable key={o.id} onPress={() => setShippingId(o.id)} style={[styles.option, active && styles.optionActive]}>
                <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={{ fontWeight: "700", fontSize: 14, color: o.amount === 0 ? COLORS.accent : COLORS.text }}>
                      {o.amount === 0 ? "مجاني" : formatIqd(o.amount)}
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.muted }}>{o.name}</Text>
                  </View>
                  {o.type?.description ? <Text style={styles.optionHint}>{o.type.description}</Text> : null}
                </View>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.h2}>الدفع</Text>
        <View style={[styles.option, styles.optionActive, { borderRadius: 12 }]}>
          <View style={[styles.radio, styles.radioActive]}>
            <View style={styles.radioDot} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "500" }}>الدفع نقداً عند الاستلام</Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>المنتجات</Text>
            <Text>{formatIqd(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>الخصم</Text>
              <Text style={{ color: COLORS.accent }}>- {formatIqd(discount)}</Text>
            </View>
          ) : null}
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>التوصيل</Text>
            <Text style={shipping?.amount === 0 ? { color: COLORS.accent, fontWeight: "700" } : undefined}>
              {shipping ? (shipping.amount === 0 ? "مجاني" : formatIqd(shipping.amount)) : "—"}
            </Text>
          </View>
          <View style={[styles.sumRow, { borderBottomWidth: 0 }]}>
            <Text style={{ fontWeight: "500" }}>المجموع</Text>
            <Text style={{ fontWeight: "700", fontSize: 20 }} testID="checkout-total">
              {formatIqd(total)}
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="تأكيد الطلب" onPress={submit} loading={loading} testID="place-order" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 18 },
  stepSmall: { fontSize: 11, color: COLORS.muted },
  h1: { fontSize: 26, fontWeight: "700" },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 10 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 8 },
  optionActive: { backgroundColor: COLORS.surface },
  optionHint: { fontSize: 11, color: "#a8a8a8" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: "#c4c4c4", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sumLabel: { color: COLORS.muted },
  error: { color: COLORS.danger, textAlign: "center" },
})
