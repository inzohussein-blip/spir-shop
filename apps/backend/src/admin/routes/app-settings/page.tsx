import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/api"

type Settings = {
  free_shipping_threshold: number
  whatsapp_number: string
  telegram_username: string
  support_phone: string
  baghdad_eta: string
  provinces_eta: string
  trust_badges: string[]
}

/** Store-wide app settings: free delivery, contact links, delivery estimates, trust badges. */
const AppSettingsPage = () => {
  const [s, setS] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ settings: Settings }>("/admin/app-settings")
      .then((r) => setS(r.settings))
      .catch((e) => toast.error((e as Error).message))
  }, [])

  if (!s) return <Text className="p-6">جاري التحميل...</Text>

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v })

  const save = async () => {
    setSaving(true)
    try {
      const r = await adminFetch<{ settings: Settings }>("/admin/app-settings", {
        method: "POST",
        body: { ...s, trust_badges: s.trust_badges.map((b) => b.trim()).filter(Boolean) },
      })
      setS(r.settings)
      toast.success("تم الحفظ", {
        description: s.free_shipping_threshold
          ? `التوصيل مجاني للطلبات من ${s.free_shipping_threshold.toLocaleString("en-US")} د.ع`
          : "التوصيل المجاني متوقف",
      })
    } catch (e) {
      toast.error("تعذّر الحفظ", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Container className="flex flex-col gap-4">
        <Heading level="h1">التوصيل</Heading>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label>توصيل مجاني للطلبات من (د.ع)</Label>
            <Input
              type="number"
              min={0}
              value={s.free_shipping_threshold}
              onChange={(e) => set("free_shipping_threshold", Number(e.target.value) || 0)}
              data-testid="free-threshold"
            />
            <Text size="xsmall" className="text-ui-fg-subtle">0 = بدون توصيل مجاني. يُطبَّق على أسعار التوصيل فعلياً.</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Label>مدة التوصيل لبغداد</Label>
            <Input value={s.baghdad_eta} onChange={(e) => set("baghdad_eta", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>مدة التوصيل للمحافظات</Label>
            <Input value={s.provinces_eta} onChange={(e) => set("provinces_eta", e.target.value)} />
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-4">
        <Heading level="h2">التواصل (يظهر في صفحة «حسابي» وصفحة الطلب)</Heading>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label>واتساب (بالصيغة الدولية)</Label>
            <Input dir="ltr" placeholder="9647700000000" value={s.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>معرّف تلكرام</Label>
            <Input dir="ltr" placeholder="spirshop" value={s.telegram_username} onChange={(e) => set("telegram_username", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>رقم الهاتف</Label>
            <Input dir="ltr" placeholder="07700000000" value={s.support_phone} onChange={(e) => set("support_phone", e.target.value)} />
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-4">
        <Heading level="h2">شارات الثقة (الرئيسية وصفحة المنتج)</Heading>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Input
              key={i}
              value={s.trust_badges[i] ?? ""}
              onChange={(e) => {
                const next = [...s.trust_badges]
                next[i] = e.target.value
                set("trust_badges", next)
              }}
            />
          ))}
        </div>
      </Container>

      <div>
        <Button onClick={save} isLoading={saving} data-testid="save-settings">
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "إعدادات التطبيق",
  icon: CogSixTooth,
  rank: 5,
})

export default AppSettingsPage
