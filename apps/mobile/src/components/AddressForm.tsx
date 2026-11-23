import { useState } from "react"
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TextInputProps, View } from "react-native"
import { COLORS, FONTS, IRAQ_GOVERNORATES } from "../lib/config"
import type { SavedAddress } from "../lib/store"
import Icon from "./Icon"
import Text from "./Text"

/** Underline-only field with a small label above (design style). */
export const Field = ({ label, required, ...props }: TextInputProps & { label: string; required?: boolean }) => (
  <View style={styles.field}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={{ color: COLORS.accent }}> *</Text> : null}
    </Text>
    <TextInput style={styles.input} placeholderTextColor="#c4c4c4" {...props} />
  </View>
)

export const EMPTY_ADDRESS: SavedAddress = { firstName: "", lastName: "", phone: "", province: "", city: "", address: "", email: "" }

export const normalizePhone = (p: string) => p.replace(/\s/g, "")
export const isValidPhone = (p: string) => /^(07\d{9}|\+9647\d{9})$/.test(normalizePhone(p))

/** Delivery address fields shared by checkout and the address screen. */
export default function AddressForm({
  value,
  onChange,
  showEmail,
}: {
  value: SavedAddress
  onChange: (v: SavedAddress) => void
  showEmail?: boolean
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const set = (k: keyof SavedAddress) => (v: string) => onChange({ ...value, [k]: v })

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <Field label="الاسم" required value={value.firstName} onChangeText={set("firstName")} testID="first-name" />
        <Field label="اللقب" value={value.lastName} onChangeText={set("lastName")} />
      </View>
      <Field
        label="رقم الهاتف"
        required
        value={value.phone}
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
          <Text style={{ fontSize: 15, color: value.province ? COLORS.text : "#c4c4c4" }}>{value.province || "اختر المحافظة"}</Text>
          <Icon name="chevron-down" size={18} />
        </View>
      </Pressable>
      <Field label="المنطقة / الحي" required value={value.city} onChangeText={set("city")} testID="city" />
      <Field label="أقرب نقطة دالة" required value={value.address} onChangeText={set("address")} placeholder="مثال: قرب جامع ..." testID="address" />
      {showEmail ? (
        <Field
          label="البريد الإلكتروني (اختياري)"
          value={value.email ?? ""}
          onChangeText={set("email")}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={{ fontSize: 17, fontWeight: "700", textAlign: "center" }}>اختر المحافظة</Text>
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
                  {value.province === g ? <Icon name="check" size={18} color={COLORS.accent} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "70%", gap: 10 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  govItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
})
