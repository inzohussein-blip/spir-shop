import { useState } from "react"
import { Pressable, ScrollView, View } from "react-native"
import Button from "../../../components/Button"
import Icon from "../../../components/Icon"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, ErrorBox, Field } from "../../../components/admin/ui"
import { adminFetch, useAdmin } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { confirmAsk } from "../../../lib/confirm"

/** Push notification to every customer of the store (or one province). */
function SendNotification() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [province, setProvince] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const send = async () => {
    if (!title.trim() || !body.trim()) return setError("اكتب العنوان والنص")
    if (!(await confirmAsk(province.trim() ? `إرسال الإشعار لزبائن ${province.trim()}؟` : "إرسال الإشعار لكل الزبائن؟", "إرسال"))) return
    setBusy(true)
    setError(null)
    setSent(null)
    try {
      const r = await adminFetch<{ campaign?: { sent_count?: number } }>("/admin/app-push/campaigns", {
        method: "POST",
        body: { title: title.trim(), body: body.trim(), link: "/", audience: province.trim() ? { province: province.trim() } : null },
      })
      setSent(r.campaign?.sent_count != null ? `تم الإرسال إلى ${r.campaign.sent_count} جهاز` : "تم الإرسال")
      setTitle("")
      setBody("")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ gap: 12 }}>
      <Text style={adminStyles.title}>إرسال إشعار للزبائن</Text>
      <Field label="العنوان" value={title} onChangeText={setTitle} placeholder="عروض نهاية الأسبوع" maxLength={80} />
      <Field label="النص" value={body} onChangeText={setBody} placeholder="خصم 15% على كل منتجات العناية بالشعر لحد الجمعة" multiline maxLength={240} />
      <Field label="المحافظة (اختياري)" value={province} onChangeText={setProvince} placeholder="اتركه فارغ للكل" hint="مثلاً: بغداد" />
      {error ? <ErrorBox message={error} /> : null}
      {sent ? <Text style={{ color: COLORS.accent, fontWeight: "700" }}>{sent}</Text> : null}
      <Button label="إرسال" icon="send" onPress={send} loading={busy} />
    </Card>
  )
}

export default function More() {
  const { tenant, tenants, selectTenant, logout } = useAdmin()
  return (
    <View style={adminStyles.page}>
      <AdminHeader title="المزيد" />
      <ScrollView contentContainerStyle={adminStyles.content} keyboardShouldPersistTaps="handled">
        <SendNotification />

        {tenants.length > 1 ? (
          <Card style={{ gap: 8 }}>
            <Text style={adminStyles.title}>المتجر</Text>
            {tenants.map((t) => (
              <Pressable key={t.id} onPress={() => selectTenant(t.id)} style={[adminStyles.rowBetween, { paddingVertical: 8 }]}>
                <Text style={{ fontWeight: t.id === tenant?.id ? "700" : "400" }}>{t.name}</Text>
                {t.id === tenant?.id ? <Icon name="check" size={18} color={COLORS.accent} /> : null}
              </Pressable>
            ))}
          </Card>
        ) : null}

        <Card style={{ gap: 6 }}>
          <Text style={adminStyles.title}>{tenant?.name}</Text>
          <Text style={adminStyles.muted}>العلامات التجارية، أحجام ودرجات المنتجات، الخصومات وتصميم الصفحة الرئيسية بالتفصيل تتعدل من لوحة التحكم على الكمبيوتر.</Text>
        </Card>

        <Button label="تسجيل الخروج" variant="outline" icon="log-out" onPress={async () => (await confirmAsk("تسجيل الخروج؟", "خروج")) && logout()} />
      </ScrollView>
    </View>
  )
}
