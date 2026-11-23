import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { StyleSheet, View } from "react-native"
import { COLORS } from "../lib/config"

const ICONS = ["map-marker", "credit-card", "check-circle"] as const

/** Checkout progress from the design: pin · · · · card · · · · check (filled icons, dotted links). */
export default function Steps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={styles.steps} testID={`steps-${step}`}>
      {ICONS.map((name, i) => (
        <View key={name} style={styles.item}>
          <MaterialCommunityIcons name={name} size={22} color={i + 1 <= step ? COLORS.primaryDark : "#c9c9cc"} />
          {i < ICONS.length - 1 ? (
            <View style={styles.dots}>
              {Array.from({ length: 6 }).map((_, d) => (
                <View key={d} style={styles.dot} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  item: { flexDirection: "row", alignItems: "center" },
  dots: { flexDirection: "row", gap: 7, marginHorizontal: 14 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#9b9b9b" },
})
