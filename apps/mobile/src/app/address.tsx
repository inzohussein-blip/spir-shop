import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import AddressForm, { EMPTY_ADDRESS, isValidPhone, normalizePhone } from "../components/AddressForm"
import Button from "../components/Button"
import Text from "../components/Text"
import { COLORS } from "../lib/config"
import { SavedAddress, useStore } from "../lib/store"

/** Delivery address kept on the device: shown on the home header, pre-fills checkout. */
export default function AddressScreen() {
  const router = useRouter()
  const { address, saveAddress } = useStore()
  const [value, setValue] = useState<SavedAddress>(address ?? EMPTY_ADDRESS)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (address) setValue(address)
  }, [address])

  const save = async () => {
    if (!value.firstName || !value.province || !value.city || !value.address) {
      setError("يرجى إكمال الاسم والمحافظة والمنطقة والعنوان")
      return
    }
    if (!isValidPhone(value.phone)) {
      setError("رقم الهاتف غير صحيح (مثال: 07701234567)")
      return
    }
    await saveAddress({ ...value, phone: normalizePhone(value.phone) })
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          نستخدم العنوان لحساب سعر ومدة التوصيل، ويُعبّأ تلقائياً عند الطلب.
        </Text>
        <AddressForm value={value} onChange={setValue} showEmail />
        {error ? <Text style={{ color: COLORS.danger, textAlign: "center" }}>{error}</Text> : null}
        <Button label="حفظ العنوان" onPress={save} testID="save-address" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
