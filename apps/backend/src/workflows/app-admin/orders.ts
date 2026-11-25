import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

/**
 * Order steps from the manager app. A cash-on-delivery order goes out in one
 * piece: "ship" fulfills every item and hands it to the courier, "deliver"
 * marks that shipment as delivered. The customer is notified by the
 * shipment.created / delivery.created subscriber.
 */

type OrderState = {
  id: string
  status: string
  items?: ({ id: string; quantity: number } | null)[] | null
  fulfillments?: ({ id: string; shipped_at?: unknown; delivered_at?: unknown; canceled_at?: unknown } | null)[] | null
}

const ORDER_FIELDS = ["id", "status", "items.id", "items.quantity", "fulfillments.id", "fulfillments.shipped_at", "fulfillments.delivered_at", "fulfillments.canceled_at"]

const live = (o: OrderState) => (o.fulfillments ?? []).filter((f) => f && !f.canceled_at) as NonNullable<NonNullable<OrderState["fulfillments"]>[number]>[]

type ShipPlan = { fulfillment_id: string | null; items: { id: string; quantity: number }[] }

const planOrderShipmentStep = createStep("plan-order-shipment", async (input: { order: OrderState | undefined }) => {
  const order = input.order
  if (!order) throw new MedusaError(MedusaError.Types.NOT_FOUND, "الطلب غير موجود")
  if (order.status === "canceled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب ملغى")
  const fulfillments = live(order)
  if (fulfillments.some((f) => f.shipped_at)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب مع المندوب من قبل")
  const items = (order.items ?? []).filter(Boolean).map((i) => ({ id: i!.id, quantity: Number(i!.quantity) }))
  const pending = fulfillments.find((f) => !f.shipped_at)
  return new StepResponse<ShipPlan>({ fulfillment_id: pending?.id ?? null, items })
})

export const shipWholeOrderWorkflow = createWorkflow("ship-whole-order", (input: { order_id: string; user_id?: string }) => {
  const { data: orders } = useQueryGraphStep({ entity: "order", fields: ORDER_FIELDS, filters: { id: input.order_id } })
  const order = transform({ orders }, ({ orders }) => orders[0] as unknown as OrderState | undefined)
  const plan = planOrderShipmentStep({ order })

  const created = when("fulfill-whole-order", { plan }, ({ plan }) => !plan.fulfillment_id).then(() =>
    createOrderFulfillmentWorkflow.runAsStep({
      input: transform({ plan, input }, ({ plan, input }) => ({
        order_id: input.order_id,
        items: plan.items,
        created_by: input.user_id,
      })),
    })
  )

  const shipment = transform({ plan, created, input }, ({ plan, created, input }) => ({
    order_id: input.order_id,
    fulfillment_id: (plan.fulfillment_id ?? created?.id) as string,
    items: plan.items,
    created_by: input.user_id,
  }))
  createOrderShipmentWorkflow.runAsStep({ input: shipment })
  return new WorkflowResponse(shipment)
})

const planOrderDeliveryStep = createStep("plan-order-delivery", async (input: { order: OrderState | undefined }) => {
  const order = input.order
  if (!order) throw new MedusaError(MedusaError.Types.NOT_FOUND, "الطلب غير موجود")
  if (order.status === "canceled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب ملغى")
  const shipped = live(order).find((f) => f.shipped_at && !f.delivered_at)
  if (!shipped) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "سلّم الطلب للمندوب أولاً")
  return new StepResponse({ fulfillment_id: shipped.id })
})

export const deliverWholeOrderWorkflow = createWorkflow("deliver-whole-order", (input: { order_id: string; user_id?: string }) => {
  const { data: orders } = useQueryGraphStep({ entity: "order", fields: ORDER_FIELDS, filters: { id: input.order_id } })
  const order = transform({ orders }, ({ orders }) => orders[0] as unknown as OrderState | undefined)
  const plan = planOrderDeliveryStep({ order })
  const delivery = transform({ plan, input }, ({ plan, input }) => ({ orderId: input.order_id, fulfillmentId: plan.fulfillment_id }))
  markOrderFulfillmentAsDeliveredWorkflow.runAsStep({ input: delivery })
  return new WorkflowResponse(delivery)
})
