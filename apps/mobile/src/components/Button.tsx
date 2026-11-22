import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View } from "react-native"
import { COLORS, RADIUS } from "../lib/config"
import Icon, { IconName } from "./Icon"
import Text from "./Text"

type Props = Omit<PressableProps, "children"> & {
  label: string
  icon?: IconName
  loading?: boolean
  variant?: "primary" | "outline"
}

/** Dark pill button (height 48, radius 24) from the design. */
export default function Button({ label, icon, loading, variant = "primary", disabled, style, ...rest }: Props) {
  const outline = variant === "outline"
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        outline ? styles.outline : styles.primary,
        (disabled || loading) && { opacity: 0.5 },
        state.pressed && { opacity: 0.85 },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? COLORS.primary : "#fff"} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={18} color={outline ? COLORS.primary : "#fff"} /> : null}
          <Text style={[styles.label, outline && { color: COLORS.primary }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { height: 48, borderRadius: RADIUS.button, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  primary: { backgroundColor: COLORS.primary },
  outline: { borderWidth: 1, borderColor: COLORS.primary, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
