import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createApiKeysWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { APP_CONTENT_MODULE } from "../../modules/app_content"
import type AppContentModuleService from "../../modules/app_content/service"
import { clearTenantCache } from "../../lib/tenant"

export type CreateTenantInput = {
  name: string
  slug: string
  owner_email?: string | null
  branding?: Record<string, unknown> | null
  features?: Record<string, unknown> | null
  settings?: Record<string, unknown> | null
}

const createTenantRecordStep = createStep(
  "create-tenant-record",
  async (
    input: CreateTenantInput & { sales_channel_id: string; api_key_id: string; api_key_token: string },
    { container }
  ) => {
    const svc = container.resolve<AppContentModuleService>(APP_CONTENT_MODULE)
    const tenant = await svc.createTenants({ ...input, is_default: false, status: "active" } as never)
    clearTenantCache()
    return new StepResponse(tenant, tenant.id)
  },
  async (id, { container }) => {
    if (!id) return
    await container.resolve<AppContentModuleService>(APP_CONTENT_MODULE).deleteTenants(id)
    clearTenantCache()
  }
)

/**
 * New store on the shared server: its own sales channel (keeps its products,
 * carts and orders apart), a publishable key for its app, the stock location
 * linked to the channel so it can sell, and the store record.
 */
export const createTenantWorkflow = createWorkflow("create-tenant", (input: CreateTenantInput) => {
  const channelInput = transform({ input }, ({ input }) => ({
    salesChannelsData: [{ name: input.name, description: `متجر ${input.slug}` }],
  }))
  const channels = createSalesChannelsWorkflow.runAsStep({ input: channelInput })

  const keyInput = transform({ input }, ({ input }) => ({
    api_keys: [{ title: `App: ${input.name}`, type: "publishable" as const, created_by: "" }],
  }))
  const keys = createApiKeysWorkflow.runAsStep({ input: keyInput })

  const link = transform({ channels, keys }, ({ channels, keys }) => ({ id: keys[0].id, add: [channels[0].id] }))
  linkSalesChannelsToApiKeyWorkflow.runAsStep({ input: link })

  const { data: locations } = useQueryGraphStep({ entity: "stock_location", fields: ["id"] }).config({ name: "tenant-stock-locations" })
  const locationLink = transform({ channels, locations }, ({ channels, locations }) => ({
    id: locations[0]?.id ?? "",
    add: locations[0] ? [channels[0].id] : [],
  }))
  linkSalesChannelsToStockLocationWorkflow.runAsStep({ input: locationLink })

  const record = transform({ input, channels, keys }, ({ input, channels, keys }) => ({
    ...input,
    slug: input.slug.toLowerCase(),
    sales_channel_id: channels[0].id,
    api_key_id: keys[0].id,
    api_key_token: keys[0].token,
  }))
  return new WorkflowResponse(createTenantRecordStep(record))
})

/** Number of products and orders per store (for the stores list). */
export async function tenantCounts(container: { resolve: (k: string) => unknown }, salesChannelIds: string[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (q: object) => Promise<{ data: Record<string, unknown>[]; metadata?: { count?: number } }>
  }
  const out: Record<string, { products: number; orders: number }> = {}
  for (const id of salesChannelIds) {
    const { data } = await query.graph({ entity: "sales_channel", fields: ["id", "products_link.product_id"], filters: { id } })
    const { metadata } = await query.graph({ entity: "order", fields: ["id"], filters: { sales_channel_id: id }, pagination: { take: 1 } })
    out[id] = {
      products: ((data[0]?.products_link as unknown[]) ?? []).length,
      orders: metadata?.count ?? 0,
    }
  }
  return out
}
