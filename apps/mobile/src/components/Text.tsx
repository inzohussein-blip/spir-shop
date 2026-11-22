import { Platform, Text as RNText, TextProps } from "react-native"
import { COLORS } from "../lib/config"

/**
 * RTL-aware text: on native `textAlign: "left"` means "start" (right in Arabic).
 * On web the root <View dir="rtl"> handles direction.
 */
export default function Text({ style, ...props }: TextProps) {
  return (
    <RNText
      {...({ lang: "ar" } as object)}
      {...props}
      style={[{ color: COLORS.text, fontSize: 15, textAlign: Platform.OS === "web" ? "auto" : "left" } as object, style]}
    />
  )
}
