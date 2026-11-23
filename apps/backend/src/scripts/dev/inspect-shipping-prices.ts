import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Dev: print shipping options with their prices and price rules. */
export default async function inspectShippingPrices({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "prices.id", "prices.amount", "prices.currency_code", "prices.price_rules.attribute", "prices.price_rules.operator", "prices.price_rules.value"],
  })
  console.log("SHIPPING", JSON.stringify(data))
}
