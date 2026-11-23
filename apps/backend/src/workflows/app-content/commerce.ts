import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  updateOrderWorkflow,
  updateShippingOptionsWorkflow,
  updateStoresWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { APP_CONTENT_MODULE } from "../../modules/app_content"
import type AppContentModuleService from "../../modules/app_content/service"
import { AppSettings } from "../../lib/app-settings"
import { STATUS_PUSH } from "../../lib/order-status"
import { sendPushCampaignWorkflow } from "./index"

const service = (container: { resolve: (k: string) => unknown }) =>
  container.resolve(APP_CONTENT_MODULE) as AppContentModuleService

/* ------------------------------ app settings ------------------------------ */

type PriceRow = {
  id: string
  amount: number
  currency_code: string
  price_rules?: { attribute: string; operator: string; value: string }[] | null
}

/**
 * Saves the app settings in the store metadata and applies the free-delivery
 * threshold to every shipping option: for each normal price, a twin price of 0
 * with the extra rule item_total >= threshold (same other rules, so region
 * prices keep their precedence).
 */
export const saveAppSettingsWorkflow = createWorkflow(
  "save-app-settings",
  (input: { settings: AppSettings }) => {
    const { data: stores } = useQueryGraphStep({ entity: "store", fields: ["id", "metadata"] })

    const storeUpdate = transform({ stores, input }, ({ stores, input }) => ({
      selector: { id: stores[0].id },
      update: { metadata: { ...(stores[0].metadata ?? {}), app_settings: input.settings } },
    }))
    updateStoresWorkflow.runAsStep({ input: storeUpdate })

    const { data: options } = useQueryGraphStep({
      entity: "shipping_option",
      fields: [
        "id",
        "prices.id",
        "prices.amount",
        "prices.currency_code",
        "prices.price_rules.attribute",
        "prices.price_rules.operator",
        "prices.price_rules.value",
      ],
    }).config({ name: "get-shipping-options" })

    const optionUpdates = transform({ options, input }, ({ options, input }) => {
      const threshold = Number(input.settings.free_shipping_threshold) || 0
      return options.map((o) => {
        const prices = (((o as unknown as { prices?: PriceRow[] }).prices ?? []) as PriceRow[]).filter(Boolean)
        const base = prices.filter((p) => !(p.price_rules ?? []).some((r) => r.attribute === "item_total"))
        const next: Record<string, unknown>[] = base.map((p) => ({ id: p.id }))
        if (threshold > 0) {
          for (const p of base) {
            const rules = (p.price_rules ?? []).map((r) => ({ attribute: r.attribute, operator: r.operator, value: r.value }))
            const region = rules.find((r) => r.attribute === "region_id")
            next.push({
              ...(region ? { region_id: region.value } : { currency_code: p.currency_code }),
              amount: 0,
              rules: [{ attribute: "item_total", operator: "gte", value: threshold }],
            })
          }
        }
        return { id: o.id, prices: next }
      })
    })
    updateShippingOptionsWorkflow.runAsStep({ input: optionUpdates as never })

    return new WorkflowResponse(input.settings)
  }
)

/* -------------------------------- reviews --------------------------------- */

export type CreateReviewInput = {
  product_id: string
  order_id: string
  rating: number
  name: string
  comment?: string | null
}

/** Only customers who ordered the product can review it (once per order). */
const validateReviewStep = createStep("validate-review", async (input: CreateReviewInput, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "status", "items.product_id"],
    filters: { id: input.order_id },
  })
  if (!order || order.status === "canceled" || !(order.items ?? []).some((i) => i?.product_id === input.product_id)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "يمكن تقييم المنتجات التي طلبتها فقط")
  }
  const [existing] = await service(container).listProductReviews({ order_id: input.order_id, product_id: input.product_id })
  if (existing) {
    throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "قيّمت هذا المنتج من قبل")
  }
  return new StepResponse(true)
})

const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewInput, { container }) => {
    const review = await service(container).createProductReviews({
      ...input,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      comment: input.comment || null,
    })
    return new StepResponse(review, review.id)
  },
  async (id, { container }) => {
    if (id) await service(container).deleteProductReviews(id)
  }
)

export const createReviewWorkflow = createWorkflow("create-review", (input: CreateReviewInput) => {
  validateReviewStep(input)
  return new WorkflowResponse(createReviewStep(input))
})

const updateReviewStatusStep = createStep(
  "update-review-status",
  async (input: { id: string; status: "approved" | "hidden" }, { container }) => {
    const svc = service(container)
    const before = await svc.retrieveProductReview(input.id)
    const review = await svc.updateProductReviews(input)
    return new StepResponse(review, { id: input.id, status: before.status })
  },
  async (prev, { container }) => {
    if (prev) await service(container).updateProductReviews(prev)
  }
)

export const updateReviewStatusWorkflow = createWorkflow(
  "update-review-status",
  (input: { id: string; status: "approved" | "hidden" }) => {
    return new WorkflowResponse(updateReviewStatusStep(input))
  }
)

const deleteReviewStep = createStep(
  "delete-review",
  async (id: string, { container }) => {
    await service(container).softDeleteProductReviews(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (id) await service(container).restoreProductReviews(id)
  }
)

export const deleteReviewWorkflow = createWorkflow("delete-review", (input: { id: string }) => {
  return new WorkflowResponse(deleteReviewStep(input.id))
})

/* ---------------------------- order status push --------------------------- */

/** Finds the devices that placed this order and sends them a status notification. */
const notifyOrderDevicesStep = createStep(
  "notify-order-devices",
  async (input: { order_id: string; display_id: number; status: keyof typeof STATUS_PUSH }, { container }) => {
    const tokens = (await service(container).listPushTokens({ enabled: true }, { take: 100000 })).filter((t) =>
      ((t.order_ids as unknown as string[] | null) ?? []).includes(input.order_id)
    )
    if (!tokens.length) return new StepResponse({ sent: 0 })
    const text = STATUS_PUSH[input.status]
    const { result } = await sendPushCampaignWorkflow(container).run({
      input: {
        kind: "campaign",
        title: text.title,
        body: text.body.replace("{n}", String(input.display_id)),
        link: `/orders/${input.order_id}`,
        audience: { token_ids: tokens.map((t) => t.id) },
      },
    })
    return new StepResponse({ sent: result.sent_count })
  }
)

export const notifyOrderStatusWorkflow = createWorkflow(
  "notify-order-status",
  (input: { order_id: string; display_id: number; status: keyof typeof STATUS_PUSH }) => {
    return new WorkflowResponse(notifyOrderDevicesStep(input))
  }
)

/** Admin confirmed the order by phone: record it and notify the customer. */
export const confirmOrderByPhoneWorkflow = createWorkflow(
  "confirm-order-by-phone",
  (input: { order_id: string; user_id: string }) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "display_id", "metadata"],
      filters: { id: input.order_id },
    })
    const update = transform({ orders, input }, ({ orders, input }) => ({
      id: input.order_id,
      user_id: input.user_id,
      metadata: { ...(orders[0]?.metadata ?? {}), confirmed_at: new Date().toISOString() },
    }))
    updateOrderWorkflow.runAsStep({ input: update })
    const notify = transform({ orders, input }, ({ orders, input }) => ({
      order_id: input.order_id,
      display_id: Number(orders[0]?.display_id),
      status: "confirmed" as const,
    }))
    notifyOrderDevicesStep(notify)
    return new WorkflowResponse(update)
  }
)
