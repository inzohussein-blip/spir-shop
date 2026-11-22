import { StyleSheet, View } from "react-native"
import { COLORS } from "../lib/config"
import Icon from "./Icon"

/** Step indicator (location - payment - done) from the design. */
export default function Steps({ step }: { step: 1 | 2 | 3 }) {
  const icons = ["map-pin", "credit-card", "check-circle"] as const
  return (
    <View style={styles.steps}>
      {icons.map((name, i) => (
        <View key={name} style={styles.stepItem}>
          <Icon name={name} size={20} color={i + 1 <= step ? COLORS.text : "#c4c4c4"} />
          {i < icons.length - 1 ? <View style={styles.dots} /> : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  stepItem: { flexDirection: "row", alignItems: "center" },
  dots: {
    width: 64,
    marginHorizontal: 8,
    borderBottomWidth: 2,
    borderStyle: "dotted",
    borderColor: "#c4c4c4",
  },
})
