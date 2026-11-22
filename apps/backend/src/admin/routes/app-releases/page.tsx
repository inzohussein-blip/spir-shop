import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowUpCircleSolid } from "@medusajs/icons"
import { Badge, Button, Checkbox, Container, Heading, Input, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, uploadFile } from "../../lib/api"

type Store = { id: string; metadata: Record<string, unknown> | null }

const str = (v: unknown) => (typeof v === "string" ? v : "")

/**
 * Publish a new version of the Android app (APK distributed outside Google Play).
 * Installed apps read these values from GET /store/mobile-version, then show
 * "new version available" (or block when required), download the APK and open
 * the Android installer.
 */
const AppReleasesPage = () => {
  const [store, setStore] = useState<Store | null>(null)
  const [version, setVersion] = useState("")
  const [required, setRequired] = useState(false)
  const [message, setMessage] = useState("")
  const [apkUrl, setApkUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { stores } = await adminFetch<{ stores: Store[] }>("/admin/stores?fields=id,metadata")
    setStore(stores[0])
    setApkUrl(str(stores[0]?.metadata?.mobile_android_url))
    setMessage(str(stores[0]?.metadata?.mobile_update_message))
  }
  useEffect(() => {
    load().catch((e) => toast.error((e as Error).message))
  }, [])

  const meta = store?.metadata ?? {}

  const onFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".apk")) {
      toast.error("الملف يجب أن يكون بصيغة APK")
      return
    }
    setUploading(true)
    try {
      setApkUrl(await uploadFile(file))
      const m = file.name.match(/(\d+\.\d+\.\d+)/)
      if (m && !version) setVersion(m[1])
    } catch (e) {
      toast.error("فشل رفع الملف", { description: (e as Error).message })
    } finally {
      setUploading(false)
    }
  }

  const publish = async () => {
    if (!store) return
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      toast.error("رقم النسخة بصيغة 1.2.0")
      return
    }
    setSaving(true)
    try {
      const metadata = {
        ...meta,
        mobile_latest_version: version,
        mobile_android_url: apkUrl,
        mobile_update_message: message,
        // A required update raises the minimum version so older apps are blocked
        ...(required ? { mobile_min_version: version } : {}),
      }
      await adminFetch(`/admin/stores/${store.id}`, { method: "POST", body: { metadata } })
      await load()
      toast.success(`تم نشر النسخة ${version}`, {
        description: required ? "النسخ الأقدم ستُطالب بالتحديث إجبارياً" : "سيظهر للمستخدمين إشعار بوجود تحديث",
      })
    } catch (e) {
      toast.error("تعذّر النشر", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <Container className="flex flex-col gap-3">
        <Heading level="h1">النسخة الحالية</Heading>
        <div className="flex flex-wrap gap-2">
          <Badge>{`آخر نسخة: ${str(meta.mobile_latest_version) || "1.0.0"}`}</Badge>
          <Badge color="orange">{`أقل نسخة مسموحة: ${str(meta.mobile_min_version) || "1.0.0"}`}</Badge>
        </div>
        {str(meta.mobile_android_url) ? (
          <a href={str(meta.mobile_android_url)} className="text-ui-fg-interactive text-sm" dir="ltr">
            {str(meta.mobile_android_url)}
          </a>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">لم يتم رفع APK بعد</Text>
        )}
      </Container>

      <Container className="flex flex-col gap-4">
        <Heading level="h2">نشر نسخة جديدة</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          ارفع ملف APK الجديد (موقّع بنفس مفتاح النسخ السابقة) وارفع رقم النسخة في app.json قبل البناء.
        </Text>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>ملف APK</Label>
            <input type="file" accept=".apk,application/vnd.android.package-archive" onChange={(e) => onFile(e.target.files?.[0])} data-testid="apk-file" />
            {uploading ? <Text size="small">جاري الرفع...</Text> : null}
            {apkUrl ? <Text size="xsmall" className="text-ui-fg-subtle" dir="ltr">{apkUrl}</Text> : null}
          </div>
          <div className="flex flex-col gap-1">
            <Label>رقم النسخة</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.1.0" dir="ltr" data-testid="apk-version" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label>رسالة التحديث (اختياري)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="أضفنا ميزات جديدة وحسّنا السرعة" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} />
            تحديث إجباري (النسخ الأقدم لا تعمل حتى تُحدَّث)
          </label>
        </div>
        <div>
          <Button onClick={publish} isLoading={saving} disabled={!apkUrl || !version || uploading} data-testid="publish-release">
            نشر التحديث
          </Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "تحديثات التطبيق",
  icon: ArrowUpCircleSolid,
  rank: 4,
})

export default AppReleasesPage
