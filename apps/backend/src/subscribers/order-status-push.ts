import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notifyOrderStatusWorkflow } from "../workflows/app-content/commerce"

/**
 * Notifies the customer's device when the order is shipped (handed to the
 * courier) or delivered. Both events carry the fulfillment id.
 */
export default async function orderStatusPush({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "order.id", "order.display_id"],
    filters: { id: event.data.id },
  })
  const order = (data[0] as unknown as { order?: { id: string; display_id: number } } | undefined)?.order
  if (!order) return
  try {
    await notifyOrderStatusWorkflow(container).run({
      input: {
        order_id: order.id,
        display_id: order.display_id,
        status: event.name === "delivery.created" ? "delivered" : "shipped",
      },
    })
  } catch (e) {
    logger.error(`Order status push failed: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["shipment.created", "delivery.created"],
}
