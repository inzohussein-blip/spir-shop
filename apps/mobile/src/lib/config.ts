export const BACKEND_URL = (process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
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
