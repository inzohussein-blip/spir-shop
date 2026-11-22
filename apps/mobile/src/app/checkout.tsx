import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native"
import Text from "../components/Text"
import { ShippingOption } from "../lib/api"
import { useCart } from "../lib/cart"
import { COLORS, IRAQ_GOVERNORATES } from "../lib/config"
import { formatIqd } from "../lib/format"
import { rememberProvince } from "../lib/push"

const Field = ({ label, ...props }: TextInputProps & { label: string }) => (
  <View style={{ gap: 6, flex: 1 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor={COLORS.muted} {...props} />
  </View>
)

export default function Checkout() {
  const router = useRouter()
  const { cart, listShippingOptions, placeOrder, loading } = useCart()
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [shippingId, setShippingId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    email: "",
  })
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    listShippingOptions().then(setOptions).catch(() => setOptions([]))
  }, [cart?.id])

  // Baghdad → Baghdad delivery, other governorates → provinces delivery
  useEffect(() => {
    if (!form.province || !options.length) return
    const wanted = form.province === "بغداد" ? "بغداد" : "المحافظات"
    const match = options.find((o) => o.name.includes(wanted))
    if (match) setShippingId(match.id)
  }, [form.province, options])

  const shipping = options.find((o) => o.id === shippingId)
  const subtotal = cart?.item_subtotal ?? cart?.subtotal ?? 0
  const total = subtotal + (shipping?.amount ?? 0)

  const submit = async () => {
    setError(null)
    const phone = form.phone.replace(/\s/g, "")
    if (!form.firstName || !form.province || !form.city || !form.address) {
      return setError("يرجى إكمال الاسم والمحافظة والمنطقة والعنوان")
    }
    if (!/^(07\d{9}|\+9647\d{9})$/.test(phone)) {
      return setError("رقم الهاتف غير صحيح (مثال: 07701234567)")
    }
    if (!shippingId) return setError("اختر طريقة التوصيل")
    try {
      const order = await placeOrder({ ...form, phone, shippingOptionId: shippingId })
      // Used to target notifications by governorate
      rememberProvince(form.province)
      router.replace({ pathname: "/order/[id]", params: { id: order.id, n: String(order.display_id), total: String(order.total) } })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!cart?.items?.length) {
    return <Text style={{ textAlign: "center", marginTop: 60 }}>السلة فارغة</Text>
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <Text style={styles.section}>معلومات التوصيل</Text>
        <View style={styles.row}>
          <Field label="الاسم *" value={form.firstName} onChangeText={set("firstName")} testID="first-name" />
          <Field label="اللقب" value={form.lastName} onChangeText={set("lastName")} />
        </View>
        <Field
          label="رقم الهاتف *"
          value={form.phone}
          onChangeText={set("phone")}
          keyboardType="phone-pad"
          placeholder="07XX XXX XXXX"
          testID="phone"
        />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>المحافظة *</Text>
          <Pressable style={styles.input} onPress={() => setPickerOpen(true)} testID="province">
            <Text style={{ color: form.province ? COLORS.text : COLORS.muted }}>
              {form.province || "اختر المحافظة"}
            </Text>
          </Pressable>
        </View>

        <Field label="المنطقة / الحي *" value={form.city} onChangeText={set("city")} testID="city" />
        <Field
          label="أقرب نقطة دالة *"
          value={form.address}
          onChangeText={set("address")}
          placeholder="مثال: قرب جامع ..."
          testID="address"
        />
        <Field
          label="البريد الإلكتروني (اختياري)"
          value={form.email}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.section}>طريقة التوصيل</Text>
        {options.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => setShippingId(o.id)}
            style={[styles.option, o.id === shippingId && styles.optionActive]}
          >
            <Text style={{ fontWeight: "600" }}>
              {o.id === shippingId ? "◉ " : "○ "}
              {o.name}
            </Text>
            <Text>{formatIqd(o.amount)}</Text>
          </Pressable>
        ))}

        <Text style={styles.section}>الدفع</Text>
        <View style={[styles.option, styles.optionActive]}>
          <Text style={{ fontWeight: "600" }}>◉ الدفع نقداً عند الاستلام</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text>المنتجات</Text>
            <Text>{formatIqd(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text>التوصيل</Text>
            <Text>{shipping ? formatIqd(shipping.amount) : "—"}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={{ fontWeight: "700" }}>المجموع</Text>
            <Text style={{ fontWeight: "700", color: COLORS.primary }} testID="checkout-total">
              {formatIqd(total)}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.primary, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading} testID="place-order">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>تأكيد الطلب</Text>}
        </Pressable>
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={[styles.section, { textAlign: "center" }]}>اختر المحافظة</Text>
            <ScrollView>
              {IRAQ_GOVERNORATES.map((g) => (
                <Pressable
                  key={g}
                  style={styles.govItem}
                  onPress={() => {
                    set("province")(g)
                    setPickerOpen(false)
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{g}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  row: { flexDirection: "row", gap: 10 },
  label: { fontSize: 13, color: COLORS.muted },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: "#fff",
    writingDirection: "rtl",
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
  },
  optionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.soft },
  summary: { backgroundColor: "#faf7f7", borderRadius: 12, padding: 14, gap: 8, marginTop: 6 },
  sumRow: { flexDirection: "row", justifyContent: "space-between" },
  error: { color: COLORS.danger, textAlign: "center" },
  primary: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: "70%",
    gap: 8,
  },
  govItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
})
