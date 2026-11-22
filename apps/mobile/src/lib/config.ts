import AsyncStorage from "@react-native-async-storage/async-storage"

/** Backend address baked in at build time (EXPO_PUBLIC_MEDUSA_BACKEND_URL). */
export const DEFAULT_BACKEND_URL = (process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

const BACKEND_KEY = "spir_backend_url"
let backendUrl = DEFAULT_BACKEND_URL

/**
 * Current backend address. It can be changed inside the app (server settings
 * screen), e.g. to test an APK against a computer on the same Wi-Fi.
 */
export const getBackendUrl = () => backendUrl

export async function loadBackendUrl() {
  try {
    const saved = await AsyncStorage.getItem(BACKEND_KEY)
    if (saved) backendUrl = saved
  } catch {
    // keep the default
  }
}

export async function saveBackendUrl(url: string | null) {
  const clean = url?.trim().replace(/\/$/, "")
  if (clean) {
    await AsyncStorage.setItem(BACKEND_KEY, clean)
    backendUrl = clean
  } else {
    await AsyncStorage.removeItem(BACKEND_KEY)
    backendUrl = DEFAULT_BACKEND_URL
  }
}
export const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/** Design tokens (from the store UI kit in Figma) */
export const COLORS = {
  bg: "#ffffff",
  /** light grey surfaces: image backgrounds, chips, inputs */
  soft: "#f3f3f3",
  surface: "#fafafa",
  /** main buttons and selected states */
  primary: "#343434",
  primaryDark: "#1d1f22",
  text: "#1d1f22",
  muted: "#8a8a8f",
  border: "#e8e8e8",
  /** checked / success accent */
  accent: "#508a7b",
  danger: "#d64545",
}

export const RADIUS = { card: 20, image: 12, button: 24, pill: 20 }

/** Soft drop shadow used on cards (0 4 10 rgba(0,0,0,.05)) */
export const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const

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
