import { Platform, StyleSheet, Text as RNText, TextProps, TextStyle } from "react-native"
import { COLORS, FONTS } from "../lib/config"

/** Picks the Tajawal font file that matches the requested weight. */
function fontFor(weight: TextStyle["fontWeight"]) {
  const w = String(weight ?? "400")
  if (w === "bold" || Number(w) >= 600) return FONTS.bold
  if (Number(w) >= 500) return FONTS.medium
  return FONTS.regular
}

/**
 * RTL-aware text: on native `textAlign: "left"` means "start" (right in Arabic).
 * On web the root <View dir="rtl"> handles direction.
 */
export default function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {}
  return (
    <RNText
      {...({ lang: "ar" } as object)}
      {...props}
      style={[
        { color: COLORS.text, fontSize: 15, textAlign: Platform.OS === "web" ? "auto" : "left" } as TextStyle,
        style,
        // Custom fonts carry their weight in the file, so the weight is applied via the family
        { fontFamily: fontFor(flat.fontWeight), fontWeight: "normal" },
      ]}
    />
  )
}
