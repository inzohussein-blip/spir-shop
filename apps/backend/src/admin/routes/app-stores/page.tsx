import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, TENANT_KEY, uploadFile } from "../../lib/api"

type Features = Record<string, boolean>
type Tenant = {
  id: string
  slug: string
  name: string
  status: "active" | "suspended"
  is_default: boolean
  api_key_token: string
  sales_channel_id: string
  owner_email: string | null
  branding: { app_name: string; logo_url?: string; theme: "elegant" | "natural" }
  features: Features
  counts?: { products: number; orders: number }
}

const FEATURES: { key: string; label: string; hint: string }[] = [
  { key: "wishlist", label: "المفضلة", hint: "قلب على المنتجات وشاشة المفضلة" },
  { key: "reviews", label: "التقييمات", hint: "تقييم المنتجات بعد الاستلام" },
  { key: "stories", label: "القصص", hint: "قصص بالصور والفيديو بالرئيسية" },
  { key: "coupons", label: "أكواد الخصم", hint: "حقل كود الخصم بإتمام الطلب" },
  { key: "brands", label: "العلامات التجارية", hint: "صفحات وقائمة العلامات" },
  { key: "notifications", label: "الإشعارات", hint: "جرس الإشعارات وقائمتها" },
  { key: "flash_sale", label: "عروض اليوم", hint: "قسم العروض بعدّاد" },
]

const THEMES = [
  { value: "elegant", label: "أنيق", colors: ["#ffffff", "#343434", "#508a7b"] },
  { value: "natural", label: "طبيعي", colors: ["#f6f6f3", "#9cc43a", "#111111"] },
] as const

function StoreCard({ t, onSaved }: { t: Tenant; onSaved: () => void }) {
  const [draft, setDraft] = useState(t)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  const save = async (patch?: Partial<Tenant>) => {
    setSaving(true)
    const next = { ...draft, ...(patch ?? {}) }
    try {
      await adminFetch(`/admin/app-tenants/${t.id}`, {
        method: "POST",
        body: {
          name: next.name,
          status: next.status,
          owner_email: next.owner_email || null,
          branding: { app_name: next.branding.app_name, theme: next.branding.theme, logo_url: next.branding.logo_url ?? "" },
          features: next.features,
        },
      })
      toast.success("تم الحفظ")
      onSaved()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex flex-col gap-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-3">
        {draft.branding.logo_url ? (
          <img src={draft.branding.logo_url} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="bg-ui-bg-subtle flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold">{t.name[0]}</div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Heading level="h2">{t.name}</Heading>
            {t.is_default ? <Badge>الافتراضي</Badge> : null}
            {t.status === "suspended" ? <Badge color="red">متوقف</Badge> : <Badge color="green">فعّال</Badge>}
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {`${t.slug} • ${t.counts?.products ?? 0} منتج • ${t.counts?.orders ?? 0} طلب`}
          </Text>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            window.localStorage.setItem(TENANT_KEY, t.id)
            window.location.href = "/app/app-builder"
          }}
        >
          تصميم التطبيق
        </Button>
        <Button variant="secondary" size="small" onClick={() => setOpen(!open)}>
          {open ? "إغلاق" : "الإعدادات"}
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label>اسم المتجر</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>اسم التطبيق (تحت الأيقونة)</Label>
              <Input value={draft.branding.app_name} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, app_name: e.target.value } })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>بريد صاحب المتجر</Label>
              <Input dir="ltr" value={draft.owner_email ?? ""} onChange={(e) => setDraft({ ...draft, owner_email: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <Label>الشعار</Label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    const url = await uploadFile(f)
                    setDraft({ ...draft, branding: { ...draft.branding, logo_url: url } })
                  } catch (err) {
                    toast.error((err as Error).message)
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>المظهر</Label>
              <div className="flex gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.value}
                    type="button"
                    onClick={() => setDraft({ ...draft, branding: { ...draft.branding, theme: th.value } })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${draft.branding.theme === th.value ? "border-ui-fg-interactive bg-ui-bg-subtle" : "border-ui-border-base"}`}
                  >
                    <span className="flex">
                      {th.colors.map((c) => (
                        <span key={c} style={{ background: c }} className="-ms-1 inline-block h-5 w-5 rounded-full border border-ui-border-base" />
                      ))}
                    </span>
                    <Text size="small">{th.label}</Text>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>ميزات التطبيق</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {FEATURES.map((f) => (
                <label key={f.key} className="flex items-center gap-3 rounded-lg border p-3">
                  <Switch
                    checked={draft.features[f.key] !== false}
                    onCheckedChange={(v) => setDraft({ ...draft, features: { ...draft.features, [f.key]: v } })}
                  />
                  <div>
                    <Text weight="plus">{f.label}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">{f.hint}</Text>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-ui-bg-subtle flex flex-col gap-1 rounded-lg p-3">
            <Text weight="plus">لبناء تطبيق هذا المتجر</Text>
            <Text size="small">
              من GitHub ← Actions ← «Android APK» ← Run workflow، واكتب اسم المتجر المختصر:{" "}
              <code dir="ltr" className="font-mono">{t.slug}</code>
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle break-all" dir="ltr">
              publishable key: {t.api_key_token}
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              المنتجات: من صفحة المنتج ← «قنوات البيع» اختر قناة «{t.name}» حتى يظهر المنتج بهذا المتجر.
            </Text>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save()} isLoading={saving}>
              حفظ
            </Button>
            {!t.is_default ? (
              <Button variant="danger" onClick={() => save({ status: t.status === "active" ? "suspended" : "active" })} isLoading={saving}>
                {t.status === "active" ? "إيقاف المتجر" : "تفعيل المتجر"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Container>
  )
}

/** All stores on the shared server: create, brand, choose features, suspend. */
const AppStoresPage = () => {
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [creating, setCreating] = useState(false)

  const load = () =>
    adminFetch<{ tenants: Tenant[] }>("/admin/app-tenants")
      .then((r) => setTenants(r.tenants))
      .catch((e) => toast.error((e as Error).message))
  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    setCreating(true)
    try {
      await adminFetch("/admin/app-tenants", { method: "POST", body: { name, slug, ...(email ? { owner_email: email } : {}) } })
      toast.success("تم إنشاء المتجر")
      setName("")
      setSlug("")
      setEmail("")
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Container className="flex flex-col gap-4">
        <Heading level="h1">المتاجر</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          كل متجر له منتجاته وطلباته وتصميم تطبيقه وقصصه وإشعاراته وإعداداته، وكلها على نفس السيرفر. لكل متجر تطبيق باسمه وشعاره.
        </Text>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1">
            <Label>اسم المتجر</Label>
            <Input placeholder="جلو نيتشر" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>الاسم المختصر (إنكليزي)</Label>
            <Input dir="ltr" placeholder="glow" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>بريد صاحب المتجر (اختياري)</Label>
            <Input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={create} isLoading={creating} disabled={name.length < 2 || slug.length < 2}>
            إنشاء متجر
          </Button>
        </div>
      </Container>
      {tenants === null ? <Text>جاري التحميل...</Text> : tenants.map((t) => <StoreCard key={`${t.id}-${t.name}-${t.status}`} t={t} onSaved={load} />)}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "المتاجر",
  icon: BuildingStorefront,
})

export default AppStoresPage
