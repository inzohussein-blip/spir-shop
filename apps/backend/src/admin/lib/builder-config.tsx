import type { Config, Data } from "@puckeditor/core"
import { useEffect, useState } from "react"
import { adminFetch, Block, Option, uploadFile } from "./api"

/*
 * Puck configuration for the app builder.
 *
 * Each Puck component name is a block `type` understood by the mobile app
 * (apps/mobile/src/sdui/Renderer.tsx). `render` is only an in-editor preview
 * that mimics the app's look; the real rendering happens in the app.
 */

const C = { soft: "#f3f3f3", primary: "#343434", dark: "#1d1f22", border: "#e8e8e8", muted: "#8a8a8f" }
const box = { fontFamily: "system-ui, sans-serif", direction: "rtl" as const, padding: "8px 12px" }

/* ------------------------------ custom fields ----------------------------- */

const mediaField = (label: string, accept: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <MediaInput value={value} onChange={onChange} accept={accept} />
  ),
})

function MediaInput({ value, onChange, accept }: { value: string; onChange: (v: string) => void; accept: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6, fontSize: 12 }}
      />
      <label style={{ fontSize: 12, color: C.primary, cursor: "pointer" }}>
        {busy ? "جاري الرفع..." : "رفع ملف"}
        <input
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setBusy(true)
            try {
              onChange(await uploadFile(f))
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {value && accept.startsWith("image") ? (
        <img src={value} alt="" style={{ maxWidth: "100%", maxHeight: 80, objectFit: "cover", borderRadius: 6 }} />
      ) : null}
    </div>
  )
}

const colorField = (label: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} />
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6, fontSize: 12, width: 100 }}
      />
    </div>
  ),
})

const dateTimeField = (label: string) => ({
  type: "custom" as const,
  label,
  render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const local = value ? new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""
    return (
      <input
        type="datetime-local"
        value={local}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
        style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
      />
    )
  },
})

const linkField = { type: "text" as const, label: "الرابط (مثل /product/handle أو /category/all)" }

/* ------------------------------ previews ---------------------------------- */

type PreviewProduct = { id: string; title: string; thumbnail: string | null; price: number | null }

function useProducts(source: string, categoryId?: string, collectionId?: string, limit = 6) {
  const [items, setItems] = useState<PreviewProduct[]>([])
  useEffect(() => {
    const qs = new URLSearchParams({
      limit: String(Math.min(limit || 6, 12)),
      fields: "id,title,thumbnail,*variants.prices",
      status: "published",
    })
    if (source === "category" && categoryId) qs.append("category_id[]", categoryId)
    if (source === "collection" && collectionId) qs.append("collection_id[]", collectionId)
    adminFetch<{ products: { id: string; title: string; thumbnail: string | null; variants: { prices: { amount: number; currency_code: string }[] }[] }[] }>(
      `/admin/products?${qs}`
    )
      .then(({ products }) =>
        setItems(
          products.map((p) => {
            const prices = p.variants.flatMap((v) => v.prices ?? []).filter((x) => x.currency_code === "iqd").map((x) => x.amount)
            return { id: p.id, title: p.title, thumbnail: p.thumbnail, price: prices.length ? Math.min(...prices) : null }
          })
        )
      )
      .catch(() => setItems([]))
  }, [source, categoryId, collectionId, limit])
  return items
}

const iqd = (n: number | null) => (n == null ? "" : `${n.toLocaleString("en-US")} د.ع`)

function ProductCardPreview({ p, width }: { p: PreviewProduct; width?: number }) {
  return (
    <div style={{ width: width ?? "auto", flex: width ? undefined : 1, minWidth: 0 }}>
      <div style={{ aspectRatio: "1", background: C.soft, borderRadius: 12, overflow: "hidden" }}>
        {p.thumbnail ? <img src={p.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{p.title}</div>
      <div style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{iqd(p.price)}</div>
    </div>
  )
}

function ProductsPreview(props: { title?: string; source?: string; category_id?: string; collection_id?: string; limit?: number; grid?: boolean }) {
  const items = useProducts(props.source ?? "all", props.category_id, props.collection_id, props.limit ?? 6)
  return (
    <div style={box}>
      {props.title ? <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{props.title}</div> : null}
      {!items.length ? (
        <div style={{ color: C.muted, fontSize: 12 }}>لا توجد منتجات لهذا المصدر</div>
      ) : props.grid ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {items.map((p) => <ProductCardPreview key={p.id} p={p} />)}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
          {items.map((p) => <ProductCardPreview key={p.id} p={p} width={110} />)}
        </div>
      )}
    </div>
  )
}

function StoryBarPreview({ title }: { title?: string }) {
  const [stories, setStories] = useState<{ id: string; title: string; media_url: string; media_type: string; thumbnail_url: string | null; is_active: boolean }[]>([])
  useEffect(() => {
    adminFetch<{ stories: typeof stories }>("/admin/app-stories").then((r) => setStories(r.stories.filter((s) => s.is_active))).catch(() => setStories([]))
  }, [])
  return (
    <div style={box}>
      {title ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div> : null}
      <div style={{ display: "flex", gap: 12 }}>
        {stories.length ? stories.map((s) => {
          const thumb = s.thumbnail_url || (s.media_type === "image" ? s.media_url : null)
          return (
            <div key={s.id} style={{ width: 60, textAlign: "center", fontSize: 10 }}>
              <div style={{ width: 54, height: 54, borderRadius: 27, border: `2px solid ${C.primary}`, padding: 2, margin: "0 auto" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: thumb ? `url(${thumb}) center/cover` : C.dark }} />
              </div>
              {s.title}
            </div>
          )
        }) : <div style={{ color: C.muted, fontSize: 12 }}>القصص تظهر هنا (أضفها من صفحة "قصص التطبيق")</div>}
      </div>
    </div>
  )
}

function CountdownPreview(p: { title?: string; subtitle?: string; ends_at?: string; background_color?: string }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = new Date(p.ends_at ?? "").getTime() - now
  const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0")
  const t = Number.isFinite(left) && left > 0
    ? `${pad(Math.floor(left / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`
    : "انتهى العرض (لن يظهر)"
  return (
    <div style={box}>
      <div style={{ background: p.background_color || C.primary, color: "#fff", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{p.title}</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{p.subtitle}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "4px 8px", fontWeight: 700 }}>{t}</div>
      </div>
    </div>
  )
}

/* ------------------------------ config ------------------------------------ */

export function buildConfig(categories: Option[], collections: Option[]): Config {
  const sourceFields = {
    source: {
      type: "select" as const,
      label: "مصدر المنتجات",
      options: [
        { label: "كل المنتجات", value: "all" },
        { label: "قسم", value: "category" },
        { label: "علامة تجارية / مجموعة", value: "collection" },
      ],
    },
    category_id: { type: "select" as const, label: "القسم", options: [{ label: "-", value: "" }, ...categories] },
    collection_id: { type: "select" as const, label: "العلامة التجارية / المجموعة", options: [{ label: "-", value: "" }, ...collections] },
    limit: { type: "number" as const, label: "عدد المنتجات", min: 1, max: 50 },
  }

  return {
    // The page itself has no settings; everything is a block
    root: { fields: {} },
    categories: {
      content: { title: "محتوى", components: ["hero_banner", "story_bar", "countdown_offer", "video_banner"] },
      products: { title: "منتجات", components: ["product_carousel", "product_grid", "category_chips", "brand_strip"] },
      layout: { title: "تنسيق", components: ["heading", "spacer"] },
    },
    components: {
      hero_banner: {
        label: "بانر",
        fields: {
          title: { type: "text", label: "العنوان" },
          subtitle: { type: "text", label: "النص الفرعي" },
          image_url: mediaField("الصورة", "image/*"),
          cta_label: { type: "text", label: "نص الزر" },
          link: linkField,
          background_color: colorField("لون الخلفية"),
          text_color: colorField("لون النص"),
        },
        defaultProps: { title: "عنوان البانر", subtitle: "", image_url: "", cta_label: "تسوقي الآن", link: "/category/all", background_color: C.soft, text_color: C.dark },
        render: (p) => (
          <div style={box}>
            <div style={{ borderRadius: 14, minHeight: 130, background: p.image_url ? `url(${p.image_url}) center/cover` : p.background_color, display: "flex", alignItems: "flex-end" }}>
              <div style={{ padding: 16, color: p.text_color, width: "100%", background: p.image_url ? "rgba(0,0,0,.25)" : undefined, borderRadius: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{p.title}</div>
                <div style={{ fontSize: 13 }}>{p.subtitle}</div>
                {p.cta_label ? <span style={{ display: "inline-block", marginTop: 8, background: C.primary, color: "#fff", borderRadius: 16, padding: "4px 12px", fontSize: 12 }}>{p.cta_label}</span> : null}
              </div>
            </div>
          </div>
        ),
      },
      story_bar: {
        label: "شريط القصص",
        fields: { title: { type: "text", label: "عنوان (اختياري)" } },
        defaultProps: { title: "" },
        render: (p) => <StoryBarPreview title={p.title} />,
      },
      countdown_offer: {
        label: "عرض بعدّاد",
        fields: {
          title: { type: "text", label: "العنوان" },
          subtitle: { type: "text", label: "النص الفرعي" },
          ends_at: dateTimeField("ينتهي في"),
          link: linkField,
          background_color: colorField("لون الخلفية"),
        },
        defaultProps: { title: "عرض لفترة محدودة", subtitle: "", ends_at: new Date(Date.now() + 24 * 3600e3).toISOString(), link: "/category/all", background_color: C.primary },
        render: (p) => <CountdownPreview {...(p as Parameters<typeof CountdownPreview>[0])} />,
      },
      video_banner: {
        label: "فيديو",
        fields: {
          video_url: mediaField("الفيديو (mp4)", "video/*"),
          title: { type: "text", label: "العنوان" },
          link: linkField,
        },
        defaultProps: { video_url: "", title: "", link: "" },
        render: (p) => (
          <div style={box}>
            <div style={{ height: 180, borderRadius: 14, overflow: "hidden", background: "#000", position: "relative" }}>
              {p.video_url ? <video src={p.video_url} muted autoPlay loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ color: "#fff", padding: 16 }}>ارفع فيديو</div>}
              {p.title ? <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, color: "#fff", background: "rgba(0,0,0,.35)", fontWeight: 700 }}>{p.title}</div> : null}
            </div>
          </div>
        ),
      },
      product_carousel: {
        label: "منتجات (سلايدر)",
        fields: { title: { type: "text", label: "العنوان" }, ...sourceFields },
        defaultProps: { title: "منتجات مختارة", source: "all", category_id: "", collection_id: "", limit: 8 },
        render: (p) => <ProductsPreview {...(p as Parameters<typeof ProductsPreview>[0])} />,
      },
      product_grid: {
        label: "منتجات (شبكة)",
        fields: { title: { type: "text", label: "العنوان" }, ...sourceFields },
        defaultProps: { title: "كل المنتجات", source: "all", category_id: "", collection_id: "", limit: 6 },
        render: (p) => <ProductsPreview {...(p as Parameters<typeof ProductsPreview>[0])} grid />,
      },
      brand_strip: {
        label: "العلامات التجارية",
        fields: { title: { type: "text", label: "العنوان" } },
        defaultProps: { title: "العلامات التجارية" },
        render: (p) => (
          <div style={box}>
            {p.title ? <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.title}</div> : null}
            <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
              {collections.length ? (
                collections.map((c) => (
                  <span
                    key={c.value}
                    style={{ minWidth: 96, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,.05)", border: "1px solid #f0f0f0", fontWeight: 700, fontSize: 12, padding: "0 8px" }}
                  >
                    {c.label}
                  </span>
                ))
              ) : (
                <span style={{ color: C.muted, fontSize: 12 }}>أضف علامات تجارية من Products ← Collections</span>
              )}
            </div>
          </div>
        ),
      },
      category_chips: {
        label: "الأقسام",
        fields: { title: { type: "text", label: "العنوان" } },
        defaultProps: { title: "الأقسام" },
        render: (p) => (
          <div style={box}>
            {p.title ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.title}</div> : null}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {categories.map((c) => (
                <span key={c.value} style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: "4px 10px", fontSize: 12 }}>{c.label}</span>
              ))}
            </div>
          </div>
        ),
      },
      heading: {
        label: "عنوان",
        fields: {
          text: { type: "text", label: "النص" },
          size: { type: "number", label: "الحجم", min: 12, max: 32 },
          align: { type: "radio", label: "المحاذاة", options: [{ label: "بداية", value: "start" }, { label: "وسط", value: "center" }] },
        },
        defaultProps: { text: "عنوان القسم", size: 20, align: "start" },
        render: (p) => <div style={{ ...box, fontWeight: 700, fontSize: p.size, textAlign: p.align === "center" ? "center" : "right" }}>{p.text}</div>,
      },
      spacer: {
        label: "مسافة",
        fields: { height: { type: "number", label: "الارتفاع", min: 4, max: 200 } },
        defaultProps: { height: 16 },
        render: (p) => <div style={{ height: p.height }} />,
      },
    },
  }
}

/* ------------------------- layout <-> Puck data --------------------------- */

export function toPuckData(blocks: Block[], config: Config): Data {
  return {
    root: { props: {} },
    content: blocks
      .filter((b) => b.type in config.components)
      .map((b) => ({ type: b.type, props: { ...b.props, id: b.id } })),
  }
}

export function fromPuckData(data: Data): Block[] {
  return (data.content ?? []).map((item) => {
    const { id, ...props } = item.props as Record<string, unknown> & { id: string }
    return { id, type: item.type as string, props }
  })
}
