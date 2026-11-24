import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows"
import { listTenants, tenantSettings, defaultTenant } from "../lib/tenant"
import { createTenantWorkflow } from "../workflows/app-content/tenants"

/**
 * Second demo store "Glow Nature" (natural theme) with a few skin-care products,
 * to show several stores on one server. Safe to run again.
 *
 * Run: npx medusa exec ./src/scripts/seed-demo-tenant.ts
 */
const HANDLES = ["ordinary-niacinamide", "ordinary-hyaluronic", "cerave-moisturizing-cream", "cerave-foaming-cleanser", "lrp-anthelios-spf50", "lrp-effaclar-gel", "loreal-micellar-water", "vitamin-c-serum"]

export default async function seedDemoTenant({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  if ((await listTenants(container, true)).some((t) => t.slug === "glow")) {
    logger.info("Demo store glow already exists")
    return
  }
  const base = tenantSettings(await defaultTenant(container))
  const { result: tenant } = await createTenantWorkflow(container).run({
    input: {
      name: "Glow Nature",
      slug: "glow",
      branding: { app_name: "Glow Nature", theme: "natural" },
      features: { stories: false, flash_sale: false },
      settings: { ...base, default_theme: "natural", trust_badges: ["طبيعي 100%", "توصيل سريع", "الدفع عند الاستلام"] },
    },
  })
  const { data: products } = await query.graph({ entity: "product", fields: ["id"], filters: { handle: HANDLES } })
  await linkProductsToSalesChannelWorkflow(container).run({
    input: { id: tenant.sales_channel_id, add: products.map((p) => p.id) },
  })
  logger.info(`Demo store "Glow Nature" created with ${products.length} products`)
}
