import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Checkbox, Container, Heading, Label, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import { adminFetch } from "../lib/api"

/**
 * Extra product content for the app, stored in product.metadata:
 * how_to_use, ingredients, and badges (bestseller / new).
 */
const ProductAppDetailsWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const meta = (data.metadata ?? {}) as Record<string, unknown>
  const [howTo, setHowTo] = useState(String(meta.how_to_use ?? ""))
  const [ingredients, setIngredients] = useState(String(meta.ingredients ?? ""))
  const badges = (meta.badges as string[] | undefined) ?? []
  const [bestseller, setBestseller] = useState(badges.includes("bestseller"))
  const [isNew, setIsNew] = useState(badges.includes("new"))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch(`/admin/products/${data.id}`, {
        method: "POST",
        body: {
          metadata: {
            ...meta,
            how_to_use: howTo.trim(),
            ingredients: ingredients.trim(),
            badges: [bestseller ? "bestseller" : null, isNew ? "new" : null].filter(Boolean),
          },
        },
      })
      toast.success("تم حفظ تفاصيل التطبيق")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center justify-between">
        <Heading level="h2">تفاصيل المنتج في التطبيق</Heading>
        <Button size="small" onClick={save} isLoading={saving}>
          حفظ
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Label>طريقة الاستخدام</Label>
        <Textarea value={howTo} onChange={(e) => setHowTo(e.target.value)} placeholder="ضعي كمية صغيرة على بشرة نظيفة صباحاً ومساءً..." />
      </div>
      <div className="flex flex-col gap-1">
        <Label>المكونات</Label>
        <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={bestseller} onCheckedChange={(v) => setBestseller(v === true)} />
          الأكثر مبيعاً
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isNew} onCheckedChange={(v) => setIsNew(v === true)} />
          جديد
        </label>
      </div>
      <Text size="xsmall" className="text-ui-fg-subtle">
        الخصومات تُضبط من Price Lists، وتظهر بالتطبيق بسعر مشطوب.
      </Text>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})

export default ProductAppDetailsWidget
