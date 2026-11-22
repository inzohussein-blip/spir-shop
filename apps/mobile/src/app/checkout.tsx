import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
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
import Button from "../components/Button"
import Icon from "../components/Icon"
import Steps from "../components/Steps"
import Text from "../components/Text"
import { ShippingOption } from "../lib/api"
import { useCart } from "../lib/cart"
import { COLORS, FONTS, IRAQ_GOVERNORATES } from "../lib/config"
import { formatIqd } from "../lib/format"
import { rememberProvince } from "../lib/push"

/** Underline-only field with a small label above (design style). */
const Field = ({ label, required, ...props }: TextInputProps & { label: string; required?: boolean }) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={{ color: COLORS.accent }}> *</Text> : null}
    </Text>
    <TextInput style={styles.input} placeholderTextColor="#c4c4c4" {...props} />
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

  // Baghdad -> Baghdad delivery, other governorates -> provinces delivery
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <Steps step={1} />
        <View>
          <Text style={styles.stepSmall}>الخطوة 1</Text>
          <Text style={styles.h1}>التوصيل</Text>
        </View>

        <View style={styles.row}>
          <Field label="الاسم" required value={form.firstName} onChangeText={set("firstName")} testID="first-name" />
          <Field label="اللقب" value={form.lastName} onChangeText={set("lastName")} />
        </View>
        <Field
          label="رقم الهاتف"
          required
          value={form.phone}
          onChangeText={set("phone")}
          keyboardType="phone-pad"
          placeholder="07XX XXX XXXX"
          testID="phone"
        />

        <Pressable style={styles.field} onPress={() => setPickerOpen(true)} testID="province">
          <Text style={styles.label}>
            المحافظة<Text style={{ color: COLORS.accent }}> *</Text>
          </Text>
          <View style={styles.selectRow}>
            <Text style={{ fontSize: 15, color: form.province ? COLORS.text : "#c4c4c4" }}>
              {form.province || "اختر المحافظة"}
            </Text>
            <Icon name="chevron-down" size={18} />
          </View>
        </Pressable>

        <Field label="المنطقة / الحي" required value={form.city} onChangeText={set("city")} testID="city" />
        <Field
          label="أقرب نقطة دالة"
          required
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

        <Text style={styles.h2}>طريقة التوصيل</Text>
        <View style={styles.optionsBox}>
          {options.map((o) => {
            const active = o.id === shippingId
            return (
              <Pressable key={o.id} onPress={() => setShippingId(o.id)} style={[styles.option, active && styles.optionActive]}>
                <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={{ fontWeight: "700", fontSize: 14 }}>{formatIqd(o.amount)}</Text>
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

        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>المنتجات</Text>
            <Text>{formatIqd(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>التوصيل</Text>
            <Text>{shipping ? formatIqd(shipping.amount) : "—"}</Text>
          </View>
          <View style={[styles.sumRow, { borderBottomWidth: 0 }]}>
            <Text style={{ fontWeight: "500" }}>المجموع</Text>
            <Text style={{ fontWeight: "700", fontSize: 20 }} testID="checkout-total">
              {formatIqd(total)}
            </Text>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button label="تأكيد الطلب" onPress={submit} loading={loading} testID="place-order" />
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={[styles.h2, { textAlign: "center", marginTop: 0 }]}>اختر المحافظة</Text>
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
                  {form.province === g ? <Icon name="check" size={18} color={COLORS.accent} /> : null}
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
  page: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, gap: 18 },
  stepSmall: { fontSize: 11, color: COLORS.muted },
  h1: { fontSize: 26, fontWeight: "700" },
  h2: { fontSize: 17, fontWeight: "700", marginTop: 10 },
  row: { flexDirection: "row", gap: 16 },
  field: { flex: 1, gap: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 6 },
  label: { fontSize: 13, color: COLORS.muted },
  input: {
    fontSize: 15,
    paddingVertical: 6,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    writingDirection: "rtl",
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  selectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  optionsBox: { gap: 6 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 8 },
  optionActive: { backgroundColor: COLORS.surface },
  optionHint: { fontSize: 11, color: "#c4c4c4" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#c4c4c4",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#fff" },
  summary: { gap: 0, marginTop: 6 },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sumLabel: { color: COLORS.muted },
  error: { color: COLORS.danger, textAlign: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
    gap: 10,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  govItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
})
