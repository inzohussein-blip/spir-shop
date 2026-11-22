export const BACKEND_URL = (process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
export const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const COLORS = {
  bg: "#ffffff",
  soft: "#fbeeec",
  primary: "#8a3b4a",
  primaryDark: "#5c2733",
  text: "#1f1a1c",
  muted: "#7a6f73",
  border: "#eee3e4",
  danger: "#c0392b",
}

/** The 18 Iraqi governorates (+ Halabja) */
export const IRAQ_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", "النجف", "كربلاء",
  "بابل", "الأنبار", "ديالى", "صلاح الدين", "واسط", "ذي قار", "ميسان", "المثنى", "القادسية", "حلبجة",
]
