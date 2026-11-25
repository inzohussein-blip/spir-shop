/// <reference types="jest" />
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"
import initialDataSeed from "../../src/migration-scripts/initial-data-seed"
import tenantsDefault from "../../src/migration-scripts/tenants-default"
import tenantsSalesChannel from "../../src/migration-scripts/tenants-sales-channel"
import { clearTenantCache } from "../../src/lib/tenant"

jest.setTimeout(240 * 1000)

// 1x1 transparent PNG
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

const OWNER = "owner@spir.test"
const STRANGER = "stranger@spir.test"
const PASSWORD = "supersecret-123"

medusaIntegrationTestRunner({
  env: { PLATFORM_ADMIN_EMAILS: OWNER },
  testSuite: ({ api, getContainer }) => {
    let admin: { headers: Record<string, string> }
    let store: { headers: Record<string, string> }

    async function createAdmin(email: string) {
      const container = getContainer()
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password: PASSWORD } })
      await createUserAccountWorkflow(container).run({ input: { authIdentityId: authIdentity!.id, userData: { email } } })
      const { data } = await api.post("/auth/user/emailpass", { email, password: PASSWORD })
      return { headers: { authorization: `Bearer ${data.token}` } }
    }

    /** Places a cash-on-delivery order for the given variant through the store API, like the app does. */
    async function placeOrder(variantId: string) {
      const { data: regions } = await api.get("/store/regions", store)
      const { data: c } = await api.post("/store/carts", { region_id: regions.regions[0].id }, store)
      const cartId = c.cart.id
      await api.post(`/store/carts/${cartId}/line-items`, { variant_id: variantId, quantity: 2 }, store)
      await api.post(
        `/store/carts/${cartId}`,
        {
          email: "customer@spir.test",
          shipping_address: { first_name: "زينب", last_name: "علي", phone: "07701234567", address_1: "الكرادة", city: "بغداد", province: "بغداد", country_code: "iq" },
        },
        store
      )
      const { data: so } = await api.get(`/store/shipping-options?cart_id=${cartId}`, store)
      await api.post(`/store/carts/${cartId}/shipping-methods`, { option_id: so.shipping_options[0].id }, store)
      const { data: pc } = await api.post("/store/payment-collections", { cart_id: cartId }, store)
      await api.post(`/store/payment-collections/${pc.payment_collection.id}/payment-sessions`, { provider_id: "pp_system_default" }, store)
      const { data: done } = await api.post(`/store/carts/${cartId}/complete`, {}, store)
      expect(done.type).toBe("order")
      return done.order as { id: string; display_id: number }
    }

    beforeEach(async () => {
      clearTenantCache()
      const container = getContainer()
      // created by Medusa's own migration scripts in a real database
      await container.resolve(Modules.FULFILLMENT).createShippingProfiles({ name: "Default Shipping Profile", type: "default" })
      await initialDataSeed({ container })
      await tenantsDefault({ container })
      await tenantsSalesChannel({ container })
      const { data } = await api.get("/mobile/config")
      store = { headers: { "x-publishable-api-key": data.publishable_key } }
      admin = await createAdmin(OWNER)
    })

    it("repairs a store that was set up on Medusa's empty default key", async () => {
      const container = getContainer()
      const svc = container.resolve("app_content") as any
      const [tenant] = await svc.listTenants({ is_default: true })
      const { data: keys } = await api.get("/admin/api-keys?type=publishable&fields=id,token,sales_channels.id", admin)
      const empty = keys.api_keys.find((k: { id: string }) => k.id !== tenant.api_key_id)
      // the broken state of stores set up before the fix
      await svc.updateTenants({ id: tenant.id, api_key_id: empty.id, api_key_token: empty.token, sales_channel_id: empty.sales_channels[0].id })
      clearTenantCache()
      const broken = (await api.get("/mobile/config")).data.publishable_key
      const { data: none } = await api.get("/store/products", { headers: { "x-publishable-api-key": broken } })
      expect(none.products).toHaveLength(0)

      await tenantsSalesChannel({ container })
      clearTenantCache()
      const fixed = (await api.get("/mobile/config")).data.publishable_key
      const { data: some } = await api.get("/store/products", { headers: { "x-publishable-api-key": fixed } })
      expect(some.products.length).toBeGreaterThan(0)
      const { data: mine } = await api.get("/admin/app-products", admin)
      expect(mine.products.length).toBe(some.products.length)
    })

    it("adds and edits a product with photos from the manager app", async () => {
      const { data: up } = await api.post("/admin/app-uploads", { files: [{ filename: "p.png", mime_type: "image/png", content: PNG }] }, admin)
      expect(up.urls).toHaveLength(1)

      const { data: created } = await api.post("/admin/app-products", { title: "منتج تجربة زعفران", price: 25000, images: up.urls }, admin)
      expect(created.product).toMatchObject({ title: "منتج تجربة زعفران", price: 25000, status: "published", simple: true })
      expect(created.product.images).toEqual(up.urls)

      const { data: edited } = await api.post(`/admin/app-products/${created.product.id}`, { price: 27000, status: "draft" }, admin)
      expect(edited.product).toMatchObject({ price: 27000, status: "draft" })

      const { data: list } = await api.get("/admin/app-products?q=زعفران", admin)
      expect(list.products.map((p: { id: string }) => p.id)).toEqual([created.product.id])

      // the customer app sees it once published, in the store's channel
      await api.post(`/admin/app-products/${created.product.id}`, { status: "published" }, admin)
      const { data: storeProducts } = await api.get(`/store/products?q=زعفران`, store)
      expect(storeProducts.products).toHaveLength(1)

      await api.delete(`/admin/app-products/${created.product.id}`, admin)
      const { data: after } = await api.get("/admin/app-products?q=زعفران", admin)
      expect(after.products).toHaveLength(0)
    })

    it("takes an order from placed to delivered", async () => {
      const { data: products } = await api.get("/admin/app-products", admin)
      const product = products.products.find((p: { title: string }) => p.title === "أحمر شفاه مات")
      const order = await placeOrder(product.variants[0].id)

      const { data: list } = await api.get("/admin/app-orders?status=placed", admin)
      expect(list.summary.counts.placed).toBe(1)
      expect(list.summary.today_orders).toBe(1)
      expect(list.orders[0]).toMatchObject({ id: order.id, current: "placed" })
      expect(list.orders[0].shipping_address.phone).toBe("07701234567")

      const { data: confirmed } = await api.post(`/admin/app-orders/${order.id}/confirm`, {}, admin)
      expect(confirmed.order.current).toBe("confirmed")

      const { data: shipped } = await api.post(`/admin/app-orders/${order.id}/ship`, {}, admin)
      expect(shipped.order.current).toBe("shipped")

      const { data: delivered } = await api.post(`/admin/app-orders/${order.id}/deliver`, {}, admin)
      expect(delivered.order.current).toBe("delivered")

      // the customer's own view follows
      const { data: mine } = await api.get(`/store/app-orders?ids=${order.id}`, store)
      expect(mine.orders[0].current).toBe("delivered")
    })

    it("cancels an order that hasn't been shipped", async () => {
      const { data: products } = await api.get("/admin/app-products", admin)
      const order = await placeOrder(products.products[0].variants[0].id)
      const { data } = await api.post(`/admin/app-orders/${order.id}/cancel`, {}, admin)
      expect(data.order.current).toBe("canceled")
      const { data: list } = await api.get("/admin/app-orders", admin)
      expect(list.summary.counts.canceled).toBe(1)
    })

    it("keeps admins who don't own a store out of it", async () => {
      const stranger = await createAdmin(STRANGER)
      const { data: products } = await api.get("/admin/app-products", admin)
      const order = await placeOrder(products.products[0].variants[0].id)

      const denied = [
        () => api.get("/admin/app-orders", stranger),
        () => api.get(`/admin/app-orders/${order.id}`, stranger),
        () => api.post(`/admin/app-orders/${order.id}/ship`, {}, stranger),
        () => api.post(`/admin/app-products/${products.products[0].id}`, { price: 1 }, stranger),
        () => api.post("/admin/app-products", { title: "x", price: 1 }, stranger),
      ]
      for (const call of denied) {
        const err = await call().then(() => null, (e) => e)
        expect(err?.response?.status).toBe(err?.response?.status === 404 ? 404 : 400)
        expect(err?.response?.data?.message).toBeTruthy()
      }
      const { data: tenants } = await api.get("/admin/app-tenants", stranger)
      expect(tenants).toMatchObject({ platform: false, tenants: [] })
    })
  },
})
