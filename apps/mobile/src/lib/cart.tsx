import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"
import { Cart, getRegionId, Order, ShippingOption, storeFetch } from "./api"

const CART_KEY = "spir_cart_id"
const CART_FIELDS =
  "fields=*items,+items.thumbnail,+items.product_id,+shipping_methods.shipping_option_id,*promotions,+discount_total,+item_total,+item_subtotal"

type CheckoutInput = {
  firstName: string
  lastName: string
  phone: string
  province: string
  city: string
  address: string
  email?: string
  shippingOptionId: string
}

type CartContextValue = {
  cart: Cart | null
  count: number
  loading: boolean
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  listShippingOptions: () => Promise<ShippingOption[]>
  applyPromo: (code: string) => Promise<void>
  removePromo: (code: string) => Promise<void>
  placeOrder: (input: CheckoutInput) => Promise<Order>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)

  const loadCart = useCallback(async (id: string) => {
    try {
      const { cart } = await storeFetch<{ cart: Cart }>(`/carts/${id}?${CART_FIELDS}`)
      setCart(cart)
    } catch {
      await AsyncStorage.removeItem(CART_KEY)
      setCart(null)
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((id) => {
      if (id) loadCart(id)
    })
  }, [loadCart])

  const ensureCart = useCallback(async (): Promise<string> => {
    if (cart?.id) return cart.id
    const region_id = await getRegionId()
    const { cart: created } = await storeFetch<{ cart: Cart }>("/carts", { method: "POST", body: { region_id } })
    await AsyncStorage.setItem(CART_KEY, created.id)
    return created.id
  }, [cart?.id])

  const run = useCallback(async <T,>(fn: () => Promise<T>) => {
    setLoading(true)
    try {
      return await fn()
    } finally {
      setLoading(false)
    }
  }, [])

  const addItem = (variantId: string, quantity = 1) =>
    run(async () => {
      const id = await ensureCart()
      await storeFetch(`/carts/${id}/line-items`, { method: "POST", body: { variant_id: variantId, quantity } })
      await loadCart(id)
    })

  const updateItem = (lineId: string, quantity: number) =>
    run(async () => {
      if (!cart) return
      await storeFetch(`/carts/${cart.id}/line-items/${lineId}`, { method: "POST", body: { quantity } })
      await loadCart(cart.id)
    })

  const removeItem = (lineId: string) =>
    run(async () => {
      if (!cart) return
      await storeFetch(`/carts/${cart.id}/line-items/${lineId}`, { method: "DELETE" })
      await loadCart(cart.id)
    })

  /** Discount codes (Medusa promotions). Throws with the server message when invalid. */
  const applyPromo = (code: string) =>
    run(async () => {
      if (!cart) return
      await storeFetch(`/carts/${cart.id}/promotions`, { method: "POST", body: { promo_codes: [code.trim().toUpperCase()] } })
      await loadCart(cart.id)
    })

  const removePromo = (code: string) =>
    run(async () => {
      if (!cart) return
      await storeFetch(`/carts/${cart.id}/promotions`, { method: "DELETE", body: { promo_codes: [code] } })
      await loadCart(cart.id)
    })

  const listShippingOptions = async () => {
    if (!cart) return []
    const { shipping_options } = await storeFetch<{ shipping_options: ShippingOption[] }>(
      `/shipping-options?cart_id=${cart.id}`
    )
    return shipping_options
  }

  /** Cash-on-delivery checkout: address → shipping method → payment session → complete. */
  const placeOrder = (input: CheckoutInput) =>
    run(async () => {
      if (!cart) throw new Error("السلة فارغة")
      const address = {
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        province: input.province,
        city: input.city,
        address_1: input.address,
        country_code: "iq",
      }
      await storeFetch(`/carts/${cart.id}`, {
        method: "POST",
        body: {
          shipping_address: address,
          billing_address: address,
          ...(input.email ? { email: input.email } : {}),
        },
      })
      await storeFetch(`/carts/${cart.id}/shipping-methods`, {
        method: "POST",
        body: { option_id: input.shippingOptionId },
      })
      const { payment_collection } = await storeFetch<{ payment_collection: { id: string } }>(
        "/payment-collections",
        { method: "POST", body: { cart_id: cart.id } }
      )
      await storeFetch(`/payment-collections/${payment_collection.id}/payment-sessions`, {
        method: "POST",
        body: { provider_id: "pp_system_default" },
      })
      const result = await storeFetch<{ type: string; order?: Order; error?: { message: string } }>(
        `/carts/${cart.id}/complete`,
        { method: "POST" }
      )
      if (result.type !== "order" || !result.order) {
        throw new Error(result.error?.message || "تعذّر إتمام الطلب")
      }
      await AsyncStorage.removeItem(CART_KEY)
      setCart(null)
      return result.order
    })

  const count = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0

  return (
    <CartContext.Provider
      value={{ cart, count, loading, addItem, updateItem, removeItem, listShippingOptions, applyPromo, removePromo, placeOrder }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
