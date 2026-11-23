import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import AddressForm, { EMPTY_ADDRESS, isValidPhone, normalizePhone } from "../../components/AddressForm"
import Button from "../../components/Button"
import Header from "../../components/Header"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { SavedAddress, useStore } from "../../lib/store"

const LABELS = ["البيت", "العمل", "أخرى"]

/** Add or edit one delivery address. */
export default function EditAddressScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const { addresses, upsertAddress, deleteAddress } = useStore()
  const existing = addresses.find((a) => a.id === id)
  const [value, setValue] = useState<SavedAddress>(existing ?? { ...EMPTY_ADDRESS, firstName: addresses[0]?.firstName ?? "", phone: addresses[0]?.phone ?? "" })
  const [label, setLabel] = useState(existing?.label ?? (addresses.length ? "العمل" : "البيت"))
  const [error, setError] = useState<string | null>(null)

  // Saved addresses load asynchronously: fill the form once they arrive
  useEffect(() => {
    if (existing) {
      setValue((v) => (v.firstName || v.city ? v : existing))
      setLabel(existing.label)
    } else if (addresses[0]) {
      setValue((v) => (v.firstName ? v : { ...v, firstName: addresses[0].firstName, lastName: addresses[0].lastName, phone: addresses[0].phone }))
    }
  }, [addresses.length, existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = () => (router.canGoBack() ? router.back() : router.replace("/address"))

  const save = async () => {
    if (!value.firstName || !value.province || !value.city || !value.address) return setError("يرجى إكمال الاسم والمحافظة والمنطقة والعنوان")
    if (!isValidPhone(value.phone)) return setError("رقم الهاتف غير صحيح (مثال: 07701234567)")
    await upsertAddress({ ...value, phone: normalizePhone(value.phone), id: existing?.id, label })
    done()
  }

  const remove = () => {
    if (!existing) return
    const go = async () => {
      await deleteAddress(existing.id)
      done()
    }
    if (Platform.OS === "web") return go()
    Alert.alert("حذف العنوان", "تريدين تحذفين هذا العنوان؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: go },
    ])
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title={existing ? "تعديل العنوان" : "عنوان جديد"} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", gap: 10 }}>
          {LABELS.map((l) => (
            <Pressable key={l} onPress={() => setLabel(l)} style={[styles.chip, label === l && styles.chipOn]} testID={`label-${l}`}>
              <Text style={[styles.chipText, label === l && { color: "#fff" }]}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <AddressForm value={value} onChange={setValue} showEmail />
        {error ? <Text style={{ color: COLORS.danger, textAlign: "center" }}>{error}</Text> : null}
        <Button label="حفظ العنوان" onPress={save} testID="save-address" />
        {existing ? (
          <Pressable onPress={remove} style={{ alignSelf: "center" }}>
            <Text style={{ color: COLORS.danger, fontSize: 14 }}>حذف العنوان</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  chip: { height: 36, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14 },
})
