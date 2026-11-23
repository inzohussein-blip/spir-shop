import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import AddressForm, { EMPTY_ADDRESS, isValidPhone, normalizePhone } from "../components/AddressForm"
import Button from "../components/Button"
import Header from "../components/Header"
import Icon from "../components/Icon"
import Steps from "../components/Steps"
import Text from "../components/Text"
import { ShippingOption } from "../lib/api"
import { useCart } from "../lib/cart"
import { COLORS, FONTS, SHADOW } from "../lib/config"
import { formatIqd } from "../lib/format"
import { syncPushToken } from "../lib/push"
import { SavedAddress, useStore } from "../lib/store"

/**
 * Checkout in the design's steps:
 *  1. Shipping: address, shipping method, coupon code
 *  2. Payment: method (cash on delivery), totals, terms, place order
 *  3. Done: /order/[id]
 */
export default function Checkout() {
  const router = useRouter()
  const { cart, listShippingOptions, placeOrder, applyPromo, removePromo, loading } = useCart()
  const { address, saveAddress, addOrder } = useStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<SavedAddress>(address ?? EMPTY_ADDRESS)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [agree, setAgree] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const promos = (cart?.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c)

  const toPayment = () => {
    setError(null)
    if (!form.firstName || !form.province || !form.city || !form.address) return setError("يرجى إكمال الاسم والمحافظة والمنطقة والعنوان")
    if (!isValidPhone(form.phone)) return setError("رقم الهاتف غير صحيح (مثال: 07701234567)")
    if (!shippingId) return setError("اختاري طريقة التوصيل")
    setStep(2)
  }

  const submitCode = async () => {
    if (!code.trim()) return
    try {
      await applyPromo(code)
      setCodeMsg({ ok: true, text: "تم تطبيق الكود" })
      setCode("")
    } catch {
      setCodeMsg({ ok: false, text: "الكود غير صالح" })
    }
  }

  const submit = async () => {
    setError(null)
    if (!agree) return setError("يرجى الموافقة على الشروط والأحكام")
    const phone = normalizePhone(form.phone)
    try {
      const order = await placeOrder({ ...form, phone, email: form.email || undefined, shippingOptionId: shippingId! })
      await saveAddress({ ...form, phone })
      await addOrder(order.id)
      syncPushToken(null, order.id)
      router.replace({ pathname: "/order/[id]", params: { id: order.id, n: String(order.display_id), total: String(order.total) } })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!cart?.items?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <Header title="إتمام الطلب" />
        <Text style={{ textAlign: "center", marginTop: 60 }}>السلة فارغة</Text>
      </View>
    )
  }

  const totals = (
    <View style={styles.totals}>
      <View style={styles.sumRow}>
        <Text style={styles.sumLabel}>سعر المنتجات</Text>
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
        <Text>{shipping ? (shipping.amount === 0 ? "مجاني" : formatIqd(shipping.amount)) : "—"}</Text>
      </View>
      <View style={[styles.sumRow, { borderBottomWidth: 0 }]}>
        <Text style={{ fontWeight: "500" }}>المجموع</Text>
        <Text style={{ fontWeight: "700", fontSize: 20 }} testID="checkout-total">
          {formatIqd(total)}
        </Text>
      </View>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="إتمام الطلب" onBack={step === 2 ? () => setStep(1) : undefined} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Steps step={step} />
        <View>
          <Text style={styles.stepSmall}>{`الخطوة ${step}`}</Text>
          <Text style={styles.h1}>{step === 1 ? "التوصيل" : "الدفع"}</Text>
        </View>

        {step === 1 ? (
          <>
            <AddressForm value={form} onChange={setForm} showEmail />

            <Text style={styles.h2}>طريقة التوصيل</Text>
            <View style={{ gap: 4 }}>
              {options.map((o) => {
                const active = o.id === shippingId
                return (
                  <Pressable key={o.id} onPress={() => setShippingId(o.id)} style={[styles.option, active && styles.optionActive]} testID={`ship-${o.id}`}>
                    <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", gap: 14 }}>
                        <Text style={{ fontWeight: "700", fontSize: 14 }}>{o.amount === 0 ? "مجاني" : formatIqd(o.amount)}</Text>
                        <Text style={{ fontSize: 14, color: "#8a8a8f" }}>{o.name}</Text>
                      </View>
                      {o.type?.description ? <Text style={styles.optionHint}>{o.type.description}</Text> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>

            <Text style={[styles.h2, { color: "#1d2a5a" }]}>كود الخصم</Text>
            <View style={styles.coupon}>
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t)
                  setCodeMsg(null)
                }}
                placeholder="عندك كود؟ اكتبيه هنا..."
                placeholderTextColor="#c4c4c4"
                autoCapitalize="characters"
                style={styles.couponInput}
                testID="promo-input"
              />
              <Pressable onPress={submitCode} disabled={loading} testID="promo-apply" hitSlop={8}>
                <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: "700" }}>تحقق</Text>
              </Pressable>
            </View>
            {codeMsg ? <Text style={{ fontSize: 12, color: codeMsg.ok ? COLORS.accent : COLORS.danger }}>{codeMsg.text}</Text> : null}
            {promos.map((p) => (
              <View key={p} style={styles.promoTag}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.accent }}>{p}</Text>
                <Pressable onPress={() => removePromo(p)} hitSlop={8}>
                  <Icon name="x" size={14} color={COLORS.accent} />
                </Pressable>
              </View>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="متابعة للدفع" onPress={toPayment} style={{ marginTop: 10 }} testID="to-payment" />
          </>
        ) : (
          <>
            <View style={styles.methods}>
              <View style={[styles.method, styles.methodOn]}>
                <MaterialCommunityIcons name="cash" size={26} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12 }}>نقداً عند الاستلام</Text>
              </View>
              <View style={[styles.method, { opacity: 0.5 }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={26} color={COLORS.muted} />
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>بطاقة (قريباً)</Text>
              </View>
            </View>
            <View style={styles.codNote}>
              <Icon name="info" size={16} color={COLORS.muted} />
              <Text style={{ flex: 1, fontSize: 12, color: COLORS.muted, lineHeight: 19 }}>
                تدفعين المبلغ للمندوب عند استلام الطلب. راح نتصل بيج على {normalizePhone(form.phone)} لتأكيد الطلب.
              </Text>
            </View>
            <View style={styles.deliverTo}>
              <Text style={{ fontSize: 12, color: COLORS.muted }}>التوصيل إلى</Text>
              <Text style={{ fontSize: 14, fontWeight: "700" }}>{`${form.firstName} ${form.lastName}`.trim()}</Text>
              <Text style={{ fontSize: 13, color: "#5a5a5e" }}>{`${form.province}، ${form.city} - ${form.address}`}</Text>
            </View>
            {totals}
            <Pressable style={styles.agree} onPress={() => setAgree(!agree)} testID="agree-terms">
              <View style={[styles.agreeBox, agree && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}>
                {agree ? <Icon name="check" size={13} color="#fff" /> : null}
              </View>
              <Text style={{ fontSize: 14 }}>
                أوافق على{" "}
                <Text style={{ textDecorationLine: "underline", fontSize: 14 }} onPress={() => router.push("/about")}>
                  الشروط والأحكام
                </Text>
              </Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="تأكيد الطلب" onPress={submit} loading={loading} testID="place-order" />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40, gap: 18 },
  stepSmall: { fontSize: 11, color: COLORS.muted },
  h1: { fontSize: 26, fontWeight: "700" },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 14 },
  option: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 6 },
  optionActive: { backgroundColor: "#fafafa" },
  optionHint: { fontSize: 11, color: "#bdbdbd" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#c4c4c4", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  coupon: { flexDirection: "row", alignItems: "center", gap: 12, height: 48, borderRadius: 8, backgroundColor: "#f6f6f6", paddingHorizontal: 18 },
  couponInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.text,
    textAlign: Platform.OS === "web" ? "right" : "left",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
  promoTag: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "#eaf3f0" },
  methods: { flexDirection: "row", gap: 12 },
  method: { flex: 1, height: 64, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 4, ...SHADOW, shadowOpacity: 0.08, elevation: 3 },
  methodOn: { backgroundColor: "#3a3a3a" },
  codNote: { flexDirection: "row", gap: 10, backgroundColor: "#fafafa", borderRadius: 10, padding: 14 },
  deliverTo: { gap: 4, paddingVertical: 4 },
  totals: { marginTop: 4 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  sumLabel: { color: "#9b9b9b" },
  agree: { flexDirection: "row", alignItems: "center", gap: 12 },
  agreeBox: { width: 20, height: 20, borderRadius: 3, borderWidth: 1.5, borderColor: "#c4c4c4", alignItems: "center", justifyContent: "center" },
  error: { color: COLORS.danger, textAlign: "center" },
})
