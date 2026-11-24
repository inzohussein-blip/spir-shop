import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PlaySolid } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, uploadFile } from "../../lib/api"
import { TenantBar } from "../../components/tenant-bar"

type Story = {
  id: string
  title: string
  media_url: string
  media_type: "image" | "video"
  link: string | null
  cta_label: string | null
  rank: number
  is_active: boolean
  expires_at: string | null
}

const empty = { title: "", media_url: "", media_type: "image" as "image" | "video", link: "", cta_label: "", rank: 0, expires_at: "" }

/** Stories shown at the top of the app (Instagram style). */
const AppStoriesPage = () => {
  const [stories, setStories] = useState<Story[]>([])
  const [form, setForm] = useState(empty)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => adminFetch<{ stories: Story[] }>("/admin/app-stories").then((r) => setStories(r.stories))
  useEffect(() => {
    load().catch(() => undefined)
  }, [])

  const onFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setForm((f) => ({ ...f, media_url: url, media_type: file.type.startsWith("video") ? "video" : "image" }))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const create = async () => {
    setSaving(true)
    try {
      await adminFetch("/admin/app-stories", {
        method: "POST",
        body: {
          title: form.title,
          media_url: form.media_url,
          media_type: form.media_type,
          link: form.link || null,
          cta_label: form.cta_label || null,
          rank: Number(form.rank) || 0,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        },
      })
      setForm(empty)
      await load()
      toast.success("تمت إضافة القصة، وهي ظاهرة الآن في التطبيق")
    } catch (e) {
      toast.error("تعذّر الحفظ", { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s: Story) => {
    await adminFetch(`/admin/app-stories/${s.id}`, { method: "POST", body: { is_active: !s.is_active } })
    await load()
  }

  const remove = async (s: Story) => {
    if (!window.confirm(`حذف القصة "${s.title}"؟`)) return
    await adminFetch(`/admin/app-stories/${s.id}`, { method: "DELETE" })
    await load()
  }

  const expired = (s: Story) => !!s.expires_at && new Date(s.expires_at).getTime() < Date.now()

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <TenantBar />
      <Container className="flex flex-col gap-4">
        <Heading level="h1">قصة جديدة</Heading>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>العنوان (يظهر تحت الدائرة)</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: درجات جديدة" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>صورة أو فيديو (عمودي 9:16)</Label>
            <input type="file" accept="image/*,video/mp4" onChange={(e) => onFile(e.target.files?.[0])} />
            {uploading ? <Text size="small">جاري الرفع...</Text> : null}
            {form.media_url ? (
              form.media_type === "video" ? (
                <video src={form.media_url} muted autoPlay loop style={{ height: 120, width: 68, objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <img src={form.media_url} alt="" style={{ height: 120, width: 68, objectFit: "cover", borderRadius: 8 }} />
              )
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Label>الرابط عند الضغط على الزر</Label>
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/product/vitamin-c-serum" dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>نص الزر</Label>
            <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="تسوّقي الآن" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>الترتيب (الأصغر أولاً)</Label>
            <Input type="number" value={form.rank} onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>تنتهي في (اختياري)</Label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>
        </div>
        <div>
          <Button onClick={create} isLoading={saving} disabled={!form.title || !form.media_url || uploading}>
            إضافة القصة
          </Button>
        </div>
      </Container>

      <Container className="flex flex-col gap-3">
        <Heading level="h2">القصص ({stories.length})</Heading>
        {!stories.length ? <Text className="text-ui-fg-subtle">لا توجد قصص بعد</Text> : null}
        <div className="flex flex-wrap gap-4">
          {stories.map((s) => (
            <div key={s.id} className="flex w-40 flex-col gap-2 rounded-lg border p-2" data-testid="story-card">
              <div style={{ height: 200, borderRadius: 8, overflow: "hidden", background: "#000" }}>
                {s.media_type === "video" ? (
                  <video src={s.media_url} muted loop autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={s.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <Text weight="plus" size="small">{s.title}</Text>
              <div className="flex flex-wrap gap-1">
                <Badge size="2xsmall">{s.media_type === "video" ? "فيديو" : "صورة"}</Badge>
                {expired(s) ? <Badge size="2xsmall" color="red">منتهية</Badge> : null}
                {s.link ? <Badge size="2xsmall" color="blue">رابط</Badge> : null}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-xs">
                  <Switch checked={s.is_active} onCheckedChange={() => toggle(s)} />
                  ظاهرة
                </label>
                <Button size="small" variant="danger" onClick={() => remove(s)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "قصص التطبيق",
  icon: PlaySolid,
  rank: 2,
})

export default AppStoriesPage
