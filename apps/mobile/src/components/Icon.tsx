import Feather from "@expo/vector-icons/Feather"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { ComponentProps } from "react"
import { COLORS } from "../lib/config"

export type IconName = ComponentProps<typeof Feather>["name"]

/** Thin line icons (Feather), matching the design's icon style. */
export default function Icon({ name, size = 22, color = COLORS.text }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />
}

export type CategoryIconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

/** Icon for a cosmetics category, picked from its name. */
export function categoryIcon(name: string): CategoryIconName {
  if (/بشر|skin/i.test(name)) return "face-woman-shimmer-outline"
  if (/مكياج|makeup/i.test(name)) return "lipstick"
  if (/شعر|hair/i.test(name)) return "hair-dryer-outline"
  if (/عطر|عطور|perfume/i.test(name)) return "spray-bottle"
  if (/جسم|body/i.test(name)) return "lotion-outline"
  return "shopping-outline"
}

export function CategoryIcon({ name, color = COLORS.text, size = 22 }: { name: string; color?: string; size?: number }) {
  return <MaterialCommunityIcons name={categoryIcon(name)} size={size} color={color} />
}
