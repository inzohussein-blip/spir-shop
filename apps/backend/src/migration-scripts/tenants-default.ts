import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../modules/app_content"
import type AppContentModuleService from "../modules/app_content/service"
import { bestPublishableKey } from "../lib/tenant"

/**
 * Multi-store upgrade: turns the existing store into the default store
 * (its sales channel + publishable key + app settings) and attaches all
 * existing app content (layouts, stories, notifications, reviews) to it.
 */
export default async function tenantsDefault({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const svc = container.resolve<AppContentModuleService>(APP_CONTENT_MODULE)

  const [existing] = await svc.listTenants({ is_default: true })
  if (existing) return

  const { data: stores } = await query.graph({ entity: "store", fields: ["id", "name", "metadata", "default_sales_channel_id"] })
  const store = stores[0]
  // The key (and its sales channel) that holds the store's products
  const key = await bestPublishableKey(container)
  if (!store || !key) {
    logger.warn("Default store not created: no sales channel or publishable key yet")
    return
  }
  const settings = ((store.metadata ?? {}) as Record<string, unknown>).app_settings as Record<string, unknown> | undefined
  const tenant = await svc.createTenants({
    slug: "spir",
    name: process.env.STORE_BRAND_NAME || store.name || "Spir Shop",
    is_default: true,
    sales_channel_id: key.sales_channel_id,
    api_key_id: key.id,
    api_key_token: key.token,
    branding: { app_name: process.env.STORE_BRAND_NAME || "Spir Shop", theme: (settings?.default_theme as string) ?? "elegant" },
    settings: settings ?? null,
  })

  const data = { tenant_id: tenant.id }
  const where = { tenant_id: null }
  await svc.updateAppLayouts({ selector: where, data })
  await svc.updateAppLayoutVersions({ selector: where, data })
  await svc.updateStories({ selector: where, data })
  await svc.updatePushTokens({ selector: where, data })
  await svc.updatePushCampaigns({ selector: where, data })
  await svc.updateProductReviews({ selector: where, data })
  logger.info(`Default store "${tenant.name}" created and existing app content attached to it`)
}
