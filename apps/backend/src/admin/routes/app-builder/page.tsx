import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { Button, Text, toast } from "@medusajs/ui"
import { Puck, type Config, type Data } from "@puckeditor/core"
import "@puckeditor/core/puck.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { adminFetch, Block, currentTenantId, Option } from "../../lib/api"
import { buildConfig, fromPuckData, toPuckData } from "../../lib/builder-config"
import { TenantBar } from "../../components/tenant-bar"

type Layout = {
  page: string
  draft: { blocks: Block[] }
  published: { blocks: Block[] } | null
  version: number
  published_at: string | null
}
type Version = { id: string; version: number; created_at: string }

const PAGE = "home"
const PREVIEW_URL_KEY = "spir_app_preview_url"

const readPreviewUrl = () => {
  try {
    return localStorage.getItem(PREVIEW_URL_KEY) || "http://localhost:8081"
  } catch {
    return "http://localhost:8081"
  }
}

/**
 * App builder: drag-and-drop editor for the mobile app home screen
 * (server-driven UI). "Publish" makes changes live in every installed app
 * instantly, without an App Store / Google Play update.
 */
const AppBuilderPage = () => {
  const [config, setConfig] = useState<Config | null>(null)
  const [initial, setInitial] = useState<Data | null>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [busy, setBusy] = useState(false)
  const [showPhone, setShowPhone] = useState(true)
  const [previewUrl, setPreviewUrl] = useState(readPreviewUrl)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // the preview shows the store selected in the store switcher
  const [storeSlug, setStoreSlug] = useState("")
  useEffect(() => {
    adminFetch<{ tenants: { id: string; slug: string; is_default: boolean }[] }>("/admin/app-tenants")
      .then((r) => {
        const id = currentTenantId()
        const t = r.tenants.find((x) => x.id === id) ?? r.tenants.find((x) => x.is_default)
        if (t) setStoreSlug(t.slug)
      })
      .catch(() => undefined)
  }, [])
  const previewSrc = storeSlug ? `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}store=${storeSlug}` : previewUrl
  const latest = useRef<Block[]>([])

  const loadVersions = useCallback(async () => {
    const r = await adminFetch<{ versions: Version[] }>(`/admin/app-layouts/${PAGE}/versions`)
    setVersions(r.versions)
  }, [])

  useEffect(() => {
    ;(async () => {
      const [l, cats, cols] = await Promise.all([
        adminFetch<{ layout: Layout }>(`/admin/app-layouts/${PAGE}`),
        adminFetch<{ product_categories: { id: string; name: string }[] }>("/admin/product-categories?fields=id,name&limit=100"),
        adminFetch<{ collections: { id: string; title: string }[] }>("/admin/collections?fields=id,title&limit=100"),
      ])
      const categories: Option[] = cats.product_categories.map((c) => ({ label: c.name, value: c.id }))
      const collections: Option[] = cols.collections.map((c) => ({ label: c.title, value: c.id }))
      const cfg = buildConfig(categories, collections)
      setConfig(cfg)
      setLayout(l.layout)
      latest.current = l.layout.draft.blocks
      setInitial(toPuckData(l.layout.draft.blocks, cfg))
      await loadVersions()
    })().catch((e) => toast.error("تعذّر التحميل", { description: (e as Error).message }))
  }, [loadVersions])

  /** Send the current draft to the embedded app preview (Expo web build). */
  const pushPreview = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "spir:preview-layout", page: PAGE, blocks: latest.current },
      "*"
    )
  }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string })?.type === "spir:preview-ready") pushPreview()
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [pushPreview])

  const onChange = (data: Data) => {
    latest.current = fromPuckData(data)
    pushPreview()
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      toast.error("حدث خطأ", { description: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const saveDraft = (blocks: Block[]) =>
    run(async () => {
      const r = await adminFetch<{ layout: Layout }>(`/admin/app-layouts/${PAGE}`, { method: "POST", body: { blocks } })
      setLayout(r.layout)
      toast.success("تم حفظ المسودة", { description: "لن تظهر في التطبيق حتى تنشرها" })
    })

  const publish = (blocks: Block[]) =>
    run(async () => {
      const r = await adminFetch<{ layout: Layout }>(`/admin/app-layouts/${PAGE}/publish`, { method: "POST", body: { blocks } })
      setLayout(r.layout)
      await loadVersions()
      toast.success(`تم النشر (نسخة ${r.layout.version})`, { description: "التغييرات ظهرت الآن في التطبيق" })
    })

  const rollback = (version: number) =>
    run(async () => {
      if (!window.confirm(`استرجاع النسخة ${version} ونشرها الآن؟`)) return
      const r = await adminFetch<{ layout: Layout }>(`/admin/app-layouts/${PAGE}/rollback`, { method: "POST", body: { version } })
      setLayout(r.layout)
      latest.current = r.layout.draft.blocks
      setInitial(toPuckData(r.layout.draft.blocks, config!))
      await loadVersions()
      toast.success(`تم استرجاع النسخة ${version} (منشورة كنسخة ${r.layout.version})`)
    })

  const header = useMemo(
    () =>
      ({ state }: { state: { data: Data } }) => (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            aria-label="سجل النسخ"
            className="bg-ui-bg-field border-ui-border-base rounded-md border px-2 py-1 text-sm"
            value=""
            disabled={busy || !versions.length}
            onChange={(e) => e.target.value && rollback(Number(e.target.value))}
          >
            <option value="">سجل النسخ ({versions.length})</option>
            {versions.map((v) => (
              <option key={v.id} value={v.version}>
                {`نسخة ${v.version} - ${new Date(v.created_at).toLocaleString("ar-IQ")}`}
              </option>
            ))}
          </select>
          <Button size="small" variant="secondary" onClick={() => setShowPhone((s) => !s)}>
            {showPhone ? "إخفاء الهاتف" : "معاينة على الهاتف"}
          </Button>
          <Button size="small" variant="secondary" disabled={busy} onClick={() => saveDraft(fromPuckData(state.data))}>
            حفظ مسودة
          </Button>
          <Button size="small" disabled={busy} isLoading={busy} onClick={() => publish(fromPuckData(state.data))} data-testid="publish-layout">
            نشر في التطبيق
          </Button>
        </div>
      ),
    [busy, versions, showPhone]
  )

  if (!config || !initial) {
    return <Text className="p-8">جاري تحميل مصمم التطبيق...</Text>
  }

  return (
    <div className="flex flex-col gap-2">
      <TenantBar />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <Text size="small" className="text-ui-fg-subtle">
          {layout?.version
            ? `النسخة المنشورة: ${layout.version} - ${new Date(layout.published_at!).toLocaleString("ar-IQ")}`
            : "لم يتم النشر بعد: التطبيق يعرض التصميم الافتراضي"}
        </Text>
        {showPhone ? (
          <label className="flex items-center gap-2 text-xs">
            رابط معاينة التطبيق (Expo web):
            <input
              className="bg-ui-bg-field border-ui-border-base w-56 rounded-md border px-2 py-1"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              onBlur={() => {
                try {
                  localStorage.setItem(PREVIEW_URL_KEY, previewUrl)
                } catch {
                  // ignore storage errors
                }
              }}
            />
          </label>
        ) : null}
      </div>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg border" data-testid="puck-editor">
          <Puck
            key={layout?.version ?? 0}
            config={config}
            data={initial}
            onChange={onChange}
            onPublish={(d) => publish(fromPuckData(d))}
            renderHeaderActions={header}
            headerTitle="مصمم التطبيق - الصفحة الرئيسية"
            viewports={[{ width: 390, height: "auto", label: "هاتف", icon: "Smartphone" }]}
            height="calc(100vh - 140px)"
          />
        </div>
        {showPhone ? (
          <div className="shrink-0" style={{ width: 300 }}>
            <div style={{ border: "10px solid #111", borderRadius: 36, overflow: "hidden", height: 600, background: "#fff" }}>
              <iframe
                ref={iframeRef}
                title="app-preview"
                src={previewSrc}
                onLoad={() => setTimeout(pushPreview, 1500)}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-2 text-center">
              معاينة حية للمسودة كما ستظهر في التطبيق
            </Text>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "مصمم التطبيق",
  icon: Sparkles,
  rank: 1,
})

export default AppBuilderPage
