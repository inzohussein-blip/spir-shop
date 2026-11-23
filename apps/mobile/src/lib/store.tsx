import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { AppSettings, getAppSettings, getRatings, Rating } from "./api"
import { rememberProvince } from "./push"

/**
 * Data the app keeps on the device (no customer account needed):
 *   - the delivery address (pre-fills checkout, drives delivery estimates)
 *   - the wishlist
 *   - the orders placed from this device (for "My orders" and tracking)
 * plus the store's app settings and a small product-rating cache.
 */

export type SavedAddress = {
  firstName: string
  lastName: string
  phone: string
  province: string
  city: string
  address: string
  email?: string
}

const KEYS = {
  address: "spir_address",
  wishlist: "spir_wishlist",
  orders: "spir_orders",
  notificationsSeen: "spir_notifications_seen",
}

const DEFAULT_SETTINGS: AppSettings = {
  free_shipping_threshold: 0,
  whatsapp_number: "",
  telegram_username: "",
  support_phone: "",
  baghdad_eta: "خلال 24 ساعة",
  provinces_eta: "خلال 2-3 أيام",
  trust_badges: ["أصلي 100%", "توصيل لكل المحافظات", "الدفع عند الاستلام"],
}

type StoreValue = {
  address: SavedAddress | null
  saveAddress: (a: SavedAddress) => Promise<void>
  wishlist: string[]
  isWished: (productId: string) => boolean
  toggleWish: (productId: string) => void
  orderIds: string[]
  addOrder: (orderId: string) => Promise<void>
  settings: AppSettings
  notificationsSeenAt: number
  markNotificationsSeen: () => void
  ratings: Record<string, Rating>
  requestRatings: (productIds: string[]) => void
}

const StoreContext = createContext<StoreValue | null>(null)

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const writeJson = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<SavedAddress | null>(null)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [seenAt, setSeenAt] = useState(0)
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const requested = useRef(new Set<string>())
  const pending = useRef(new Set<string>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    readJson<SavedAddress | null>(KEYS.address, null).then(setAddress)
    readJson<string[]>(KEYS.wishlist, []).then(setWishlist)
    readJson<string[]>(KEYS.orders, []).then(setOrderIds)
    readJson<number>(KEYS.notificationsSeen, 0).then(setSeenAt)
    getAppSettings().then(setSettings).catch(() => undefined)
  }, [])

  const saveAddress = useCallback(async (a: SavedAddress) => {
    setAddress(a)
    await writeJson(KEYS.address, a)
    await rememberProvince(a.province)
  }, [])

  const toggleWish = useCallback((productId: string) => {
    setWishlist((cur) => {
      const next = cur.includes(productId) ? cur.filter((x) => x !== productId) : [productId, ...cur]
      writeJson(KEYS.wishlist, next)
      return next
    })
  }, [])

  const addOrder = useCallback(async (orderId: string) => {
    setOrderIds((cur) => {
      const next = [orderId, ...cur.filter((x) => x !== orderId)].slice(0, 50)
      writeJson(KEYS.orders, next)
      return next
    })
  }, [])

  const markNotificationsSeen = useCallback(() => {
    const now = Date.now()
    setSeenAt(now)
    writeJson(KEYS.notificationsSeen, now)
  }, [])

  /** Batches rating lookups from all product cards on screen into one request. */
  const requestRatings = useCallback((ids: string[]) => {
    let added = false
    for (const id of ids) {
      if (!requested.current.has(id)) {
        requested.current.add(id)
        pending.current.add(id)
        added = true
      }
    }
    if (!added || timer.current) return
    timer.current = setTimeout(async () => {
      timer.current = null
      const batch = [...pending.current]
      pending.current.clear()
      try {
        const r = await getRatings(batch)
        setRatings((cur) => ({ ...cur, ...r }))
      } catch {
        batch.forEach((id) => requested.current.delete(id))
      }
    }, 120)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      address,
      saveAddress,
      wishlist,
      isWished: (id) => wishlist.includes(id),
      toggleWish,
      orderIds,
      addOrder,
      settings,
      notificationsSeenAt: seenAt,
      markNotificationsSeen,
      ratings,
      requestRatings,
    }),
    [address, saveAddress, wishlist, toggleWish, orderIds, addOrder, settings, seenAt, markNotificationsSeen, ratings, requestRatings]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}

/** Sale info for a product: original price, current price and discount %, when on sale. */
export function saleInfo(p: { variants: { calculated_price?: { calculated_amount: number; original_amount: number } }[] }) {
  const v = p.variants.find((x) => x.calculated_price)
  const c = v?.calculated_price
  if (!c || !(c.original_amount > c.calculated_amount)) return null
  return {
    original: c.original_amount,
    price: c.calculated_amount,
    percent: Math.round((1 - c.calculated_amount / c.original_amount) * 100),
  }
}
