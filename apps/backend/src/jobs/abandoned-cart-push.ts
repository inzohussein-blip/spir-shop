import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"
import { APP_CONTENT_MODULE } from "../modules/app_content"
import type AppContentModuleService from "../modules/app_content/service"
import { sendPushCampaignWorkflow } from "../workflows/app-content"

/**
 * Abandoned-cart reminder: every 30 minutes, find app carts that have items,
 * were not checked out, and were last touched between ABANDONED_CART_HOURS
 * (default 3) and 48 hours ago. Send one push per cart, once.
 */
export default async function abandonedCartPush(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const svc = container.resolve<AppContentModuleService>(APP_CONTENT_MODULE)

  const hours = Number(process.env.ABANDONED_CART_HOURS || 3)
  const now = Date.now()
  const olderThan = new Date(now - hours * 3600 * 1000)
  const newerThan = new Date(now - 48 * 3600 * 1000)

  // Only carts that belong to an app install with an enabled push token
  const tokens = await svc.listPushTokens({ enabled: true, cart_id: { $ne: null } }, { take: 10000 })
  if (!tokens.length) return

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "updated_at", "completed_at", "metadata", "items.id"],
    filters: { id: tokens.map((t) => t.cart_id!) },
  })

  const due = carts.filter((c) => {
    const updated = new Date(c.updated_at as Date).getTime()
    return (
      !c.completed_at &&
      (c.items?.length ?? 0) > 0 &&
      !(c.metadata as Record<string, unknown> | null)?.abandoned_reminded_at &&
      updated <= olderThan.getTime() &&
      updated >= newerThan.getTime()
    )
  })
  if (!due.length) return

  const dueIds = new Set(due.map((c) => c.id))
  const tokenIds = tokens.filter((t) => t.cart_id && dueIds.has(t.cart_id)).map((t) => t.id)

  const { result } = await sendPushCampaignWorkflow(container).run({
    input: {
      kind: "abandoned_cart",
      title: process.env.ABANDONED_CART_TITLE || "نسيتي شي بالسلة",
      body:
        process.env.ABANDONED_CART_BODY ||
        "منتجاتك بعدها بانتظارك. كمّلي الطلب والدفع عند الاستلام.",
      link: "/cart",
      audience: { token_ids: tokenIds },
    },
  })

  for (const cart of due) {
    await updateCartWorkflow(container).run({
      input: {
        id: cart.id,
        metadata: {
          ...((cart.metadata as Record<string, unknown>) ?? {}),
          abandoned_reminded_at: new Date().toISOString(),
        },
      },
    })
  }

  logger.info(`Abandoned-cart push: ${due.length} carts, ${result.sent_count} sent`)
}

export const config = {
  name: "abandoned-cart-push",
  schedule: "*/30 * * * *",
}
