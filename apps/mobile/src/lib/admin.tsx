import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Platform } from "react-native"
import { getBackendUrl, STORE_SLUG } from "./config"

/**
 * The store manager's session: logs in with the admin email and password
 * (Medusa's /auth/user/emailpass), keeps the token in the phone's secure
 * storage, and sends it with the selected store (x-tenant-id) on every request.
 */

const TOKEN_KEY = "spir_admin_token"
const TENANT_KEY = "spir_admin_tenant"

// SecureStore has no web implementation; the web build (testing only) uses local storage
const storage = {
  get: (k: string) => (Platform.OS === "web" ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  remove: (k: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
}

export class AdminError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

let session: { token: string | null; tenantId: string | null; onExpired?: () => void } = { token: null, tenantId: null }

const MESSAGES: Record<number, string> = {
  401: "انتهت الجلسة، سجّل الدخول من جديد",
  403: "ليس لديك صلاحية",
  404: "غير موجود",
}

/** Admin API call (JSON). Throws AdminError with an Arabic message the screens can show. */
export async function adminFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (session.token) headers.authorization = `Bearer ${session.token}`
  if (session.tenantId) headers["x-tenant-id"] = session.tenantId
  let res: Response
  try {
    res = await fetch(`${getBackendUrl()}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new AdminError("تعذّر الاتصال بالسيرفر، تأكد من الإنترنت", 0)
  }
  const json = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/user/emailpass") session.onExpired?.()
    // Medusa's own messages are English; ours (and validation errors) are shown as they are
    const arabic = json.message && /[؀-ۿ]/.test(json.message) ? json.message : null
    throw new AdminError(arabic ?? MESSAGES[res.status] ?? json.message ?? `خطأ ${res.status}`, res.status)
  }
  return json as T
}

export type Tenant = { id: string; slug: string; name: string; is_default: boolean; status: string; branding?: { app_name?: string; logo_url?: string } }

type Ctx = {
  ready: boolean
  token: string | null
  tenant: Tenant | null
  tenants: Tenant[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  selectTenant: (id: string) => Promise<void>
}

const AdminContext = createContext<Ctx | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)

  const logout = useCallback(async () => {
    session = { token: null, tenantId: null, onExpired: session.onExpired }
    setToken(null)
    setTenants([])
    setTenantId(null)
    await storage.remove(TOKEN_KEY).catch(() => undefined)
  }, [])

  /** Loads the stores this user manages and picks one: the last chosen, this app's store, or the first. */
  const loadTenants = useCallback(async () => {
    const { tenants: list } = await adminFetch<{ tenants: Tenant[] }>("/admin/app-tenants")
    if (!list.length) throw new AdminError("حسابك غير مرتبط بأي متجر", 403)
    const saved = await AsyncStorage.getItem(TENANT_KEY).catch(() => null)
    const pick = list.find((t) => t.id === saved) ?? list.find((t) => t.slug === STORE_SLUG) ?? list.find((t) => t.is_default) ?? list[0]
    session.tenantId = pick.id
    setTenants(list)
    setTenantId(pick.id)
  }, [])

  useEffect(() => {
    session.onExpired = () => {
      logout()
    }
    ;(async () => {
      const saved = await storage.get(TOKEN_KEY).catch(() => null)
      if (saved) {
        session.token = saved
        try {
          await loadTenants()
          setToken(saved)
        } catch {
          await logout()
        }
      }
      setReady(true)
    })()
  }, [loadTenants, logout])

  const login = useCallback(
    async (email: string, password: string) => {
      let t: string
      try {
        t = (await adminFetch<{ token: string }>("/auth/user/emailpass", { method: "POST", body: { email: email.trim(), password } })).token
      } catch (e) {
        if (e instanceof AdminError && (e.status === 401 || e.status === 400)) throw new AdminError("البريد أو كلمة المرور غير صحيحة", e.status)
        throw e
      }
      session.token = t
      try {
        await loadTenants()
      } catch (e) {
        session.token = null
        throw e
      }
      await storage.set(TOKEN_KEY, t)
      setToken(t)
    },
    [loadTenants]
  )

  const selectTenant = useCallback(async (id: string) => {
    session.tenantId = id
    setTenantId(id)
    await AsyncStorage.setItem(TENANT_KEY, id).catch(() => undefined)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ ready, token, tenants, tenant: tenants.find((t) => t.id === tenantId) ?? null, login, logout, selectTenant }),
    [ready, token, tenants, tenantId, login, logout, selectTenant]
  )
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin outside AdminSessionProvider")
  return ctx
}

/* ------------------------------- data types ------------------------------- */

export type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "canceled"

export type AdminOrder = {
  id: string
  display_id: number
  created_at: string
  current: OrderStatus
  total: number
  item_total?: number
  shipping_total?: number
  discount_total?: number
  email?: string | null
  confirmed_at?: string | null
  steps: { key: string; label: string; at: string | null }[]
  shipping_address?: {
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    province?: string | null
    city?: string | null
    address_1?: string | null
    address_2?: string | null
  } | null
  shipping_methods?: { name: string }[] | null
  items?: { id: string; title: string; product_title?: string | null; variant_title?: string | null; thumbnail?: string | null; quantity: number; unit_price: number }[] | null
}

export type OrdersResponse = {
  summary: { counts: Record<OrderStatus, number>; today_orders: number; today_total: number }
  orders: AdminOrder[]
}

export type AdminProduct = {
  id: string
  title: string
  description?: string | null
  status: "published" | "draft" | "proposed" | "rejected"
  thumbnail?: string | null
  images: string[]
  price: number | null
  simple: boolean
  variants: { id: string; title: string; price: number | null }[]
  categories?: { id: string; name: string }[] | null
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "جديد",
  confirmed: "مؤكد",
  shipped: "مع المندوب",
  delivered: "تم التسليم",
  canceled: "ملغى",
}

export const STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  placed: { bg: "#fff4e5", fg: "#b26a00" },
  confirmed: { bg: "#e8f1fd", fg: "#1f5fae" },
  shipped: { bg: "#efe9fb", fg: "#5b3aa8" },
  delivered: { bg: "#e7f5ee", fg: "#2c7a4b" },
  canceled: { bg: "#f6e8e8", fg: "#a33a3a" },
}

export type PickedImage = { base64: string; mime: string; name: string }

/** Uploads photos picked on the phone; returns their public URLs. */
export async function uploadImages(images: PickedImage[]): Promise<string[]> {
  if (!images.length) return []
  const { urls } = await adminFetch<{ urls: string[] }>("/admin/app-uploads", {
    method: "POST",
    body: { files: images.map((i) => ({ filename: i.name, mime_type: i.mime, content: i.base64 })) },
  })
  return urls
}
