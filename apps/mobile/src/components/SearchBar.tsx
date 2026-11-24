import { Pressable, StyleSheet, View } from "react-native"
import { COLORS, IS_NATURAL, SHADOW } from "../lib/config"
import Icon from "./Icon"
import Text from "./Text"

/**
 * Search field that opens the search screen, with a filter button.
 *  - "elegant": pill + separate square filter button
 *  - "natural": one wide pill with the filter icon inside, after a thin divider
 */
export default function SearchBar({ onPress, onFilter, placeholder = "ابحثي", testID = "discover-search" }: { onPress: () => void; onFilter: () => void; placeholder?: string; testID?: string }) {
  if (IS_NATURAL) {
    return (
      <View style={[styles.search, styles.natural]}>
        <Pressable style={styles.inner} onPress={onPress} testID={testID}>
          <Icon name="search" size={19} color="#9a9d96" />
          <Text style={styles.text}>{placeholder}</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={onFilter} hitSlop={8} accessibilityLabel="فلتر" testID="discover-filter">
          <Icon name="sliders" size={19} color={COLORS.primaryDark} />
        </Pressable>
      </View>
    )
  }
  return (
    <View style={styles.row}>
      <Pressable style={[styles.search, { flex: 1 }]} onPress={onPress} testID={testID}>
        <Icon name="search" size={19} color="#8a8a8f" />
        <Text style={styles.text}>{placeholder}</Text>
      </Pressable>
      <Pressable style={styles.filterBtn} onPress={onFilter} accessibilityLabel="فلتر" testID="discover-filter">
        <Icon name="sliders" size={19} color="#5a5a5e" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  search: {
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    ...SHADOW,
    shadowOpacity: 0.07,
    elevation: 3,
  },
  natural: { height: 52, borderRadius: 26, gap: 12 },
  inner: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: "100%" },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  text: { color: "#8a8a8f", fontSize: 14 },
  filterBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", ...SHADOW, shadowOpacity: 0.07, elevation: 3 },
})
