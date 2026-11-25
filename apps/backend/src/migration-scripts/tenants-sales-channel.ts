import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { APP_CONTENT_MODULE } from "../modules/app_content"
import type AppContentModuleService from "../modules/app_content/service"
import { bestPublishableKey, keySalesChannelId } from "../lib/tenant"

/**
 * Repair for stores set up before this fix:
 *  - a store's sales channel must be the one linked to its publishable key
 *    (that's where the app's carts and orders go);
 *  - the default store could have been given Medusa's own key on the empty
 *    "Default Sales Channel", so the app showed no products. When its channel
 *    is empty it moves to the key whose channel holds the products.
 * The app discovers its key from the server (/mobile/config) on every launch,
 * so installed apps follow without an update.
 */
export default async function tenantsSalesChannel({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const svc = container.resolve<AppContentModuleService>(APP_CONTENT_MODULE)

  for (const t of await svc.listTenants({}, { take: 1000 })) {
    let channel = (await keySalesChannelId(container, t.api_key_id)) ?? t.sales_channel_id
    const update: Record<string, string> = {}
    if (channel !== t.sales_channel_id) update.sales_channel_id = channel

    if (t.is_default) {
      const { data } = await query.graph({ entity: "sales_channel", fields: ["id", "products_link.product_id"], filters: { id: channel } })
      const empty = !((data[0]?.products_link as unknown[]) ?? []).length
      const best = empty ? await bestPublishableKey(container) : null
      if (best && best.products > 0 && best.id !== t.api_key_id) {
        Object.assign(update, { api_key_id: best.id, api_key_token: best.token, sales_channel_id: best.sales_channel_id })
        channel = best.sales_channel_id
      }
    }
    if (Object.keys(update).length) {
      await svc.updateTenants({ id: t.id, ...update })
      logger.info(`Store "${t.slug}": now uses sales channel ${channel}${update.api_key_id ? ` and key ${update.api_key_id}` : ""}`)
    }
  }
}
