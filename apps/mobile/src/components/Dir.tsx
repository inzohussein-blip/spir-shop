import { Platform, View, ViewProps } from "react-native"

/**
 * View with a fixed writing direction. Native uses the `direction` style;
 * react-native-web needs the `dir` attribute instead.
 */
export default function Dir({ dir, style, ...rest }: ViewProps & { dir: "ltr" | "rtl" }) {
  if (Platform.OS === "web") return <View {...rest} {...({ dir } as object)} style={style} />
  return <View {...rest} style={[style, { direction: dir }]} />
}
