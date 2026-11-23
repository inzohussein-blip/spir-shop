import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPriceListsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Demo "Deals of the day": a sale price list ending in 3 days with discounts
 * on a few demo products. Manage real sales in the admin under "Price Lists".
 *
 * Run: npx medusa exec ./src/scripts/seed-demo-sale.ts   (skips if it exists)
 */
const DEALS: Record<string, number> = {
  "ordinary-niacinamide": 0.2,
  "lrp-anthelios-spf50": 0.15,
  "nyx-soft-matte-lip-cream": 0.15,
  "cerave-foaming-cleanser": 0.1,
  "loreal-micellar-water": 0.25,
}

export default async function seedDemoSale({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({ entity: "price_list", fields: ["id", "title"] })
  if (existing.some((l) => l.title === "عروض اليوم")) {
    logger.info("Demo sale already exists")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["handle", "variants.id", "variants.prices.amount", "variants.prices.currency_code"],
    filters: { handle: Object.keys(DEALS) },
  })

  const prices = products.flatMap((p) =>
    (p.variants ?? []).flatMap((v) => {
      const base = ((v as unknown as { prices?: { amount: number; currency_code: string }[] }).prices ?? []).find(
        (x) => x.currency_code === "iqd"
      )
      if (!v || !base) return []
      // Round the sale price to the nearest 250 IQD
      const amount = Math.round((base.amount * (1 - DEALS[p.handle])) / 250) * 250
      return [{ variant_id: v.id, currency_code: "iqd", amount }]
    })
  )

  await createPriceListsWorkflow(container).run({
    input: {
      price_lists_data: [
        {
          title: "عروض اليوم",
          description: "Demo sale for the app's Deals of the day block",
          status: "active",
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          prices,
        },
      ],
    },
  })
  logger.info(`Demo sale created: ${prices.length} variant prices on ${products.length} products`)
}
