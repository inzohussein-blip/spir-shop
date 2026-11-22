import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { adminFetch } from "../lib/api"

/**
 * Color swatches for shades (lipstick, foundation...). Saved in
 * product.metadata.swatches as { "<option value>": "#hex" }; the app and the
 * website show a colored circle instead of the shade name.
 */
const ProductSwatchesWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const values = useMemo(
    () => Array.from(new Set((data.options ?? []).flatMap((o) => (o.values ?? []).map((v) => v.value)))),
    [data.options]
  )
  const initial = ((data.metadata?.swatches as Record<string, string> | undefined) ?? {}) as Record<string, string>
  const [swatches, setSwatches] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)

  // Only products with several option values (shades, sizes...) need swatches
  if (values.length < 2) return null

  const save = async () => {
    setSaving(true)
    try {
      const clean = Object.fromEntries(Object.entries(swatches).filter(([, hex]) => /^#[0-9a-f]{3,8}$/i.test(hex)))
      await adminFetch(`/admin/products/${data.id}`, {
        method: "POST",
        body: { metadata: { ...(data.metadata ?? {}), swatches: clean } },
      })
      toast.success("تم حفظ ألوان الدرجات")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center justify-between">
        <Heading level="h2">ألوان الدرجات</Heading>
        <Button size="small" onClick={save} isLoading={saving}>
          حفظ
        </Button>
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        اختر لوناً لكل درجة ليظهر كدائرة ملونة في التطبيق والموقع. اترك القيمة فارغة لعرض الاسم كنص.
      </Text>
      <div className="flex flex-col gap-2">
        {values.map((v) => (
          <div key={v} className="flex items-center gap-2" data-testid={`swatch-row-${v}`}>
            <input
              type="color"
              value={swatches[v] || "#ffffff"}
              onChange={(e) => setSwatches({ ...swatches, [v]: e.target.value })}
            />
            <input
              className="bg-ui-bg-field border-ui-border-base w-24 rounded-md border px-2 py-1 text-xs"
              dir="ltr"
              value={swatches[v] ?? ""}
              placeholder="#hex"
              onChange={(e) => setSwatches({ ...swatches, [v]: e.target.value })}
            />
            <Text size="small">{v}</Text>
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side",
})

export default ProductSwatchesWidget
