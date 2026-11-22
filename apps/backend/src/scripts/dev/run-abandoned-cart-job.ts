import type { ExecArgs } from "@medusajs/framework/types"
import abandonedCartPush from "../../jobs/abandoned-cart-push"

/**
 * Dev helper: run the abandoned-cart job once, now.
 * ABANDONED_CART_HOURS=0 npx medusa exec ./src/scripts/dev/run-abandoned-cart-job.ts
 */
export default async function runAbandonedCartJob({ container }: ExecArgs) {
  await abandonedCartPush(container)
}
