import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/app-sale - the active sale (price list of type "sale") for the
 * "Deals of the day" block: its end date and the products it discounts.
 * Discounted prices themselves come with the products (calculated_price).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = Date.now()
  const { data: lists } = await query.graph({
    entity: "price_list",
    fields: ["id", "title", "type", "status", "starts_at", "ends_at", "prices.price_set_id"],
    filters: { type: "sale", status: "active" },
  })
  const active = lists.filter(
    (l) => (!l.starts_at || new Date(l.starts_at).getTime() <= now) && (!l.ends_at || new Date(l.ends_at).getTime() > now)
  )
  if (!active.length) {
    res.json({ sale: null })
    return
  }
  // The sale ending soonest drives the countdown
  active.sort((a, b) => (a.ends_at ? new Date(a.ends_at).getTime() : Infinity) - (b.ends_at ? new Date(b.ends_at).getTime() : Infinity))
  const priceSetIds = [...new Set(active.flatMap((l) => (l.prices ?? []).map((p) => p?.price_set_id)).filter((x): x is string => !!x))]

  const { data: variants } = priceSetIds.length
    ? await query.graph({
        entity: "product_variant_price_set",
        fields: ["variant.product_id"],
        filters: { price_set_id: priceSetIds },
      })
    : { data: [] as { variant?: { product_id?: string | null } | null }[] }
  const productIds = [...new Set(variants.map((v) => v.variant?.product_id).filter((x): x is string => !!x))]

  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ sale: { title: active[0].title, ends_at: active[0].ends_at, product_ids: productIds } })
}
