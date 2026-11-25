import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, updateProductsWorkflow, updateProductVariantsWorkflow, useQueryGraphStep } from "@medusajs/medusa/core-flows"

/**
 * Products from the manager app: one variant with one price (IQD), photos,
 * categories, listed in the store's own sales channel. Products with several
 * variants (sizes, shades) keep their prices managed from the dashboard.
 */
export const STORE_CURRENCY = "iqd"

type SimpleProductInput = {
  sales_channel_id: string
  title: string
  description?: string | null
  price: number
  status: "published" | "draft"
  images: string[]
  category_ids?: string[]
}

const requireShippingProfileStep = createStep("require-shipping-profile", async (input: { profiles: { id: string }[] }) => {
  const profile = input.profiles[0]
  if (!profile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No shipping profile: run the initial data seed first")
  return new StepResponse(profile.id)
})

export const createSimpleProductWorkflow = createWorkflow("create-simple-product", (input: SimpleProductInput) => {
  const { data: profiles } = useQueryGraphStep({ entity: "shipping_profile", fields: ["id"] })
  const shippingProfileId = requireShippingProfileStep({ profiles: profiles as unknown as { id: string }[] })
  const products = transform({ input, shippingProfileId }, ({ input, shippingProfileId }) => [
    {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      thumbnail: input.images[0] ?? null,
      images: input.images.map((url) => ({ url })),
      category_ids: input.category_ids,
      shipping_profile_id: shippingProfileId,
      sales_channels: [{ id: input.sales_channel_id }],
      options: [{ title: "الحجم", values: ["افتراضي"] }],
      variants: [
        {
          title: "افتراضي",
          options: { الحجم: "افتراضي" },
          manage_inventory: false,
          prices: [{ amount: input.price, currency_code: STORE_CURRENCY }],
        },
      ],
    },
  ])
  const created = createProductsWorkflow.runAsStep({ input: { products } })
  return new WorkflowResponse(created)
})

type UpdateSimpleProductInput = {
  id: string
  title?: string
  description?: string | null
  price?: number
  status?: "published" | "draft"
  images?: string[]
  category_ids?: string[]
}

export const updateSimpleProductWorkflow = createWorkflow("update-simple-product", (input: UpdateSimpleProductInput) => {
  const update = transform({ input }, ({ input }) => ({
    selector: { id: input.id },
    update: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.category_ids !== undefined ? { category_ids: input.category_ids } : {}),
      ...(input.images !== undefined ? { images: input.images.map((url) => ({ url })), thumbnail: input.images[0] ?? null } : {}),
    },
  }))
  const products = updateProductsWorkflow.runAsStep({ input: update })

  when("update-simple-product-price", { input }, ({ input }) => input.price !== undefined).then(() =>
    updateProductVariantsWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        selector: { product_id: input.id },
        update: { prices: [{ amount: input.price as number, currency_code: STORE_CURRENCY }] },
      })),
    })
  )
  return new WorkflowResponse(products)
})
