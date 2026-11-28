import Constants from "expo-constants"
import { reloadAppAsync } from "expo"
import { Platform } from "react-native"
import { readThemeName, writeThemeName } from "./theme-store"

/**
 * The shared server every store's app talks to. Set at build time with
 * EXPO_PUBLIC_MEDUSA_BACKEND_URL; release builds fall back to the public
 * server, development to the computer running the backend.
 */
const PUBLIC_SERVER = "https://backend-production-eb711937.up.railway.app"
export const BACKEND_URL = (
  process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || (__DEV__ ? "http://localhost:9000" : PUBLIC_SERVER)
).replace(/\/$/, "")
export const getBackendUrl = () => BACKEND_URL

/**
 * Which store this app belongs to (stores/<slug>.json, chosen at build time).
 * On the web build "?store=<slug>" switches it, for previews of other stores.
 */
function readStoreSlug(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      const q = new URLSearchParams(window.location.search).get("store")
      if (q) window.localStorage.setItem("spir_store", q)
      const saved = window.localStorage.getItem("spir_store")
      if (saved) return saved
    } catch {
      // ignore
    }
  }
  const extra = Constants.expoConfig?.extra as { store?: string } | undefined
  return extra?.store || process.env.EXPO_PUBLIC_STORE || "spir"
}
export const STORE_SLUG = readStoreSlug()

export const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/* --------------------------------- themes --------------------------------- */

export type ThemeName = "elegant" | "natural"

/** Two looks the customer (or the store, as default) can choose in Settings. */
export const THEMES: Record<ThemeName, { label: string; description: string }> = {
  elegant: { label: "أنيق", description: "أبيض ورمادي داكن، بسيط وراقي" },
  natural: { label: "طبيعي", description: "أخضر فاتح وبيج، مستوحى من الطبيعة" },
}

const PALETTES = {
  elegant: {
    bg: "#ffffff",
    /** grey pages (forms, lists of cards) */
    pageAlt: "#fafafa",
    card: "#ffffff",
    /** light grey surfaces: image backgrounds, chips, inputs */
    soft: "#f3f3f3",
    surface: "#fafafa",
    /** main buttons */
    primary: "#343434",
    onPrimary: "#ffffff",
    primaryDark: "#1d1f22",
    /** selected chips, active category, filter buttons */
    strong: "#3a2c27",
    onStrong: "#ffffff",
    /** black pills (view all, segments) */
    dark: "#000000",
    onDark: "#ffffff",
    /** status banners (order, rate) */
    banner: "#575757",
    text: "#1d1f22",
    muted: "#8a8a8f",
    border: "#e8e8e8",
    /** checked / success / stars */
    accent: "#508a7b",
    /** links like "View all" */
    link: "#9b9b9b",
    danger: "#d64545",
    /** sale prices, discount badges, countdowns */
    sale: "#fa6338",
    saleSoft: "#fff1ec",
  },
  natural: {
    bg: "#f6f6f3",
    pageAlt: "#f6f6f3",
    card: "#ffffff",
    soft: "#ecece7",
    surface: "#ffffff",
    primary: "#9cc43a",
    onPrimary: "#11140e",
    primaryDark: "#1c1f1a",
    strong: "#9cc43a",
    onStrong: "#11140e",
    dark: "#111111",
    onDark: "#ffffff",
    banner: "#7fa52a",
    text: "#1c1f1a",
    muted: "#8a8d86",
    border: "#e4e4de",
    accent: "#7fa52a",
    link: "#7fa52a",
    danger: "#d64545",
    sale: "#fa6338",
    saleSoft: "#fff1ec",
  },
}

const isTheme = (v: string | null): v is ThemeName => v === "elegant" || v === "natural"
const userTheme = readThemeName("user")
const storeTheme = readThemeName("store")
/** The customer's choice, else the store's default (from the admin), else "elegant" */
export const THEME_NAME: ThemeName = isTheme(userTheme) ? userTheme : isTheme(storeTheme) ? storeTheme : "elegant"
/** true when the customer chose the theme themselves */
export const THEME_CHOSEN = isTheme(userTheme)
export const IS_NATURAL = THEME_NAME === "natural"

/** Design tokens of the active theme */
export const COLORS = PALETTES[THEME_NAME]

export const RADIUS = IS_NATURAL ? { card: 20, image: 16, button: 26, pill: 22 } : { card: 20, image: 12, button: 24, pill: 20 }

/** Extra space at the bottom of tab screens so content clears the floating tab bar */
export const TAB_SPACE = IS_NATURAL ? 92 : 0

/** Soft drop shadow used on cards (0 4 10 rgba(0,0,0,.05)) */
export const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const

/** Remember the store's default theme; used from the next launch unless the customer chose one. */
export function rememberStoreTheme(name: string | undefined) {
  if (isTheme(name ?? null) && name !== storeTheme) writeThemeName(name!, "store")
}

/** Save the customer's theme and restart the app so every screen picks it up. */
export async function applyTheme(name: ThemeName, restart = true) {
  writeThemeName(name, "user")
  if (!restart) return
  if (Platform.OS === "web") window.location.reload()
  else await reloadAppAsync()
}

export const FONTS = {
  regular: "Tajawal_400Regular",
  medium: "Tajawal_500Medium",
  bold: "Tajawal_700Bold",
}

/** The 18 Iraqi governorates (+ Halabja) */
export const IRAQ_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", "النجف", "كربلاء",
  "بابل", "الأنبار", "ديالى", "صلاح الدين", "واسط", "ذي قار", "ميسان", "المثنى", "القادسية", "حلبجة",
]
