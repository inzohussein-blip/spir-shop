import { View } from "react-native"
import { COLORS } from "../lib/config"
import Text from "./Text"

/** Read-only star rating in the design's green, e.g. 4.4 -> ★★★★☆ (count). */
export default function Stars({ value, size = 12, count, gap = 1 }: { value: number; size?: number; count?: number; gap?: number }) {
  const full = Math.round(value)
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: size, color: COLORS.accent, letterSpacing: gap, lineHeight: size * 1.3 }}>
        {"★".repeat(full)}
        <Text style={{ fontSize: size, color: "#d3d6da" }}>{"★".repeat(5 - full)}</Text>
      </Text>
      {count != null ? <Text style={{ fontSize: Math.max(9, size - 2), color: COLORS.muted }}>({count})</Text> : null}
    </View>
  )
}
