import { View } from "react-native"
import Text from "./Text"

const GOLD = "#e2a93b"

/** Read-only star rating, e.g. 4.5 -> four full stars and one half-dim star. */
export default function Stars({ value, size = 12, count }: { value: number; size?: number; count?: number }) {
  const full = Math.round(value)
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: size, color: GOLD, letterSpacing: 1 }}>
        {"★".repeat(full)}
        <Text style={{ fontSize: size, color: "#d9d9d9" }}>{"★".repeat(5 - full)}</Text>
      </Text>
      {count != null ? <Text style={{ fontSize: size - 1, color: "#8a8a8f" }}>({count})</Text> : null}
    </View>
  )
}
