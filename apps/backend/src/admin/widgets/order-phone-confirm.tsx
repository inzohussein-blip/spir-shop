import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { adminFetch } from "../lib/api"

/**
 * "Confirmed by phone" step of the app's order timeline. Shipping and delivery
 * are recorded with Medusa's normal fulfillment actions on this page; each step
 * sends a notification to the customer's phone.
 */
const OrderPhoneConfirmWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const initial = (data.metadata?.confirmed_at as string | undefined) ?? null
  const [confirmedAt, setConfirmedAt] = useState<string | null>(initial)
  const [busy, setBusy] = useState(false)
  const phone = data.shipping_address?.phone

  const confirm = async () => {
    setBusy(true)
    try {
      await adminFetch(`/admin/app-orders/${data.id}/confirm`, { method: "POST" })
      setConfirmedAt(new Date().toISOString())
      toast.success("تم تأكيد الطلب وإشعار الزبون")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Container className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center justify-between">
        <Heading level="h2">تأكيد الطلب بالهاتف</Heading>
        {confirmedAt ? <Badge color="green">مؤكد</Badge> : <Badge color="orange">بانتظار التأكيد</Badge>}
      </div>
      {phone ? (
        <a href={`tel:${phone}`} className="text-ui-fg-interactive text-sm" dir="ltr">
          {phone}
        </a>
      ) : null}
      {confirmedAt ? (
        <Text size="small" className="text-ui-fg-subtle">
          تم التأكيد: {new Date(confirmedAt).toLocaleString("ar-IQ")}
        </Text>
      ) : (
        <Button size="small" onClick={confirm} isLoading={busy} disabled={data.status === "canceled"}>
          تم التأكيد مع الزبون
        </Button>
      )}
      <Text size="xsmall" className="text-ui-fg-subtle">
        بعدها: «Fulfill» ثم «Mark as shipped» عند التسليم للمندوب، و«Mark as delivered» عند الاستلام. كل خطوة ترسل إشعاراً للزبون.
      </Text>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side",
})

export default OrderPhoneConfirmWidget
