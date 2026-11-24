import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BellAlert } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch, IRAQ_GOVERNORATES } from "../../lib/api"
import { TenantBar } from "../../components/tenant-bar"

type Campaign = {
  id: string
  kind: "campaign" | "abandoned_cart"
  title: string
  body: string
  link: string | null
  audience: { province?: string | null } | null
  status: string
  sent_count: number
  failed_count: number
  sent_at: string | null
}
type Stats = { total: number; by_province: Record<string, number> }

/** Push notifications: send offers to app users, see history and reach. */
const AppNotificationsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [form, setForm] = useState({ title: "", body: "", link: "", province: "" })
  const [sending, setSending] = useState(false)

  const load = async () => {
    const [s, c] = await Promise.all([
      adminFetch<Stats>("/admin/app-push/stats"),
      adminFetch<{ campaigns: Campaign[] }>("/admin/app-push/campaigns"),
    ])
    setStats(s)
    setCampaigns(c.campaigns)
  }
  useEffect(() => {
    load().catch(() => undefined)
  }, [])

  const reach = stats ? (form.province ? stats.by_province[form.province] ?? 0 : stats.total) : 0

  const send = async () => {
    if (!window.confirm(`إرسال الإشعار إلى ${reach} جهاز؟`)) return
    setSending(true)
    try {
      const r = await adminFetch<{ campaign: Campaign }>("/admin/app-push/campaigns", {
        method: "POST",
        body: {
          title: form.title,
          body: form.body,
          link: form.link || null,
          audience: form.province ? { province: form.province } : null,
        },
      })
      toast.success(`تم الإرسال إلى ${r.campaign.sent_count} جهاز`)
      setForm({ title: "", body: "", link: "", province: "" })
      await load()
    } catch (e) {
      toast.error("تعذّر الإرسال", { description: (e as Error).message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <TenantBar />
      <Container className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Heading level="h1">إشعار جديد</Heading>
          <Badge>{stats ? `${stats.total} جهاز مشترك` : "..."}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="خصم 20% اليوم فقط" maxLength={80} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>المحافظة (اختياري)</Label>
            <select
              className="bg-ui-bg-field border-ui-border-base h-8 rounded-md border px-2 text-sm"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            >
              <option value="">كل المحافظات</option>
              {IRAQ_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g} ({stats?.by_province[g] ?? 0})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label>النص</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={240} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>يفتح عند الضغط (اختياري)</Label>
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/product/vitamin-c-serum" dir="ltr" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={send} isLoading={sending} disabled={!form.title || !form.body || !reach}>
            إرسال الآن
          </Button>
          <Text size="small" className="text-ui-fg-subtle">
            سيصل إلى {reach} جهاز
          </Text>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          تذكير السلة المتروكة يُرسل تلقائياً بعد عدة ساعات من ترك منتجات في السلة (ABANDONED_CART_HOURS).
        </Text>
      </Container>

      <Container className="flex flex-col gap-3">
        <Heading level="h2">السجل</Heading>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>الإشعار</Table.HeaderCell>
              <Table.HeaderCell>النوع</Table.HeaderCell>
              <Table.HeaderCell>الجمهور</Table.HeaderCell>
              <Table.HeaderCell>وصل / فشل</Table.HeaderCell>
              <Table.HeaderCell>التاريخ</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {campaigns.map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <Text weight="plus" size="small">{c.title}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">{c.body}</Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={c.kind === "abandoned_cart" ? "orange" : "blue"}>
                    {c.kind === "abandoned_cart" ? "سلة متروكة" : "حملة"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{c.audience?.province || "الكل"}</Table.Cell>
                <Table.Cell>{`وصل ${c.sent_count} - فشل ${c.failed_count}`}</Table.Cell>
                <Table.Cell>{c.sent_at ? new Date(c.sent_at).toLocaleString("ar-IQ") : "-"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "إشعارات التطبيق",
  icon: BellAlert,
  rank: 3,
})

export default AppNotificationsPage
