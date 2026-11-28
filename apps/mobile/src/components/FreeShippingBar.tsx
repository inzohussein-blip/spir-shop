import { StyleSheet, View } from "react-native"
import { COLORS } from "../lib/config"
import { formatIqd } from "../lib/format"
import { useStore } from "../lib/store"
import Icon from "./Icon"
import Text from "./Text"

/** How much more to add for free delivery (from the store's app settings), with a progress bar. */
export default function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { settings } = useStore()
  const threshold = settings.free_shipping_threshold
  if (!threshold) return null
  const left = Math.max(0, threshold - subtotal)
  const pct = Math.min(1, subtotal / threshold)
  return (
    <View style={styles.box} testID="free-shipping-bar">
      <View style={styles.row}>
        <Icon name="truck" size={16} color={left ? COLORS.sale : COLORS.accent} />
        <Text style={styles.text}>
          {left ? (
            <>
              أضيفي <Text style={{ color: COLORS.sale, fontWeight: "700" }}>{formatIqd(left)}</Text> وتحصلين على توصيل مجاني
            </>
          ) : (
            "طلبك يستحق التوصيل المجاني 🎉"
          )}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: left ? COLORS.sale : COLORS.accent }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { backgroundColor: COLORS.saleSoft, borderRadius: 10, padding: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { fontSize: 13, flex: 1 },
  track: { height: 6, borderRadius: 3, backgroundColor: "#f6d9cf", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
})
