import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { openLink } from "../../lib/links"
import { BlockProps, str } from "../types"

type Item = { label?: string; title?: string; image_url?: string; link?: string; background_color?: string }

/** Small grey caption with a short vertical bar before it ("| NEW COLLECTION" in the design). */
function Label({ text }: { text?: string }) {
  if (!text) return null
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelBar} />
      <Text style={styles.label} numberOfLines={1}>
        {text}
      </Text>
    </View>
  )
}

/** Product photo sitting on a soft circle. */
function CircleImage({ uri, size }: { uri?: string; size: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? <Image source={uri} style={{ width: size * 0.9, height: size * 1.05 }} contentFit="contain" /> : null}
    </View>
  )
}

/**
 * Collection banner (design: "HANG OUT & PARTY" and "Top Collection" cards).
 *  - variant "wide": full width strip, light title
 *  - variant "card": rounded card, light title
 *  - variant "bold": taller rounded card, bold title
 */
export function CollectionBanner({ props }: BlockProps) {
  const router = useRouter()
  const variant = str(props.variant, "card")
  const link = str(props.link)
  const wide = variant === "wide"
  const bold = variant === "bold"
  const height = wide ? 178 : bold ? 210 : 140
  return (
    <Pressable
      onPress={() => openLink(router, link)}
      disabled={!link}
      style={[
        styles.banner,
        { height, backgroundColor: str(props.background_color, "#f8f8f8") },
        wide ? { marginHorizontal: -20, borderRadius: 0 } : null,
      ]}
      testID={`collection-${str(props.title).slice(0, 12)}`}
    >
      <View style={[styles.text, wide && { paddingHorizontal: 32 }]}>
        <Label text={str(props.label)} />
        <Text style={[styles.title, bold && styles.titleBold]} numberOfLines={3}>
          {str(props.title)}
        </Text>
      </View>
      <View style={styles.imageSide}>
        <CircleImage uri={str(props.image_url)} size={wide ? 140 : bold ? 150 : 112} />
      </View>
    </Pressable>
  )
}

/** Two half-width collection cards side by side (design: "The Office Life" / "Elegant Design"). */
export function CollectionPair({ props }: BlockProps) {
  const router = useRouter()
  const items = (Array.isArray(props.items) ? props.items : []).slice(0, 2) as Item[]
  if (!items.length) return null
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {items.map((it, i) => (
        <Pressable
          key={i}
          onPress={() => openLink(router, it.link)}
          style={[styles.half, { backgroundColor: it.background_color || "#f8f8f8" }]}
        >
          {it.image_url ? <Image source={it.image_url} style={styles.halfImage} contentFit="cover" /> : null}
          <View style={styles.halfText}>
            {it.label ? <Text style={styles.halfLabel}>{it.label}</Text> : null}
            <Text style={styles.halfTitle} numberOfLines={3}>
              {it.title ?? ""}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { borderRadius: 10, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  text: { flex: 1, paddingHorizontal: 22, gap: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  labelBar: { width: 1, height: 14, backgroundColor: "#9b9b9b" },
  label: { fontSize: 12, color: "#9b9b9b" },
  title: { fontSize: 19, lineHeight: 27, color: "#6b6b6b", fontWeight: "500" },
  titleBold: { fontSize: 21, lineHeight: 30, color: COLORS.primaryDark, fontWeight: "700" },
  imageSide: { width: "45%", height: "100%", alignItems: "center", justifyContent: "center" },
  circle: { backgroundColor: "#ececec", alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  half: { flex: 1, height: 196, borderRadius: 10, overflow: "hidden", flexDirection: "row" },
  halfImage: { width: "48%", height: "100%" },
  halfText: { flex: 1, padding: 12, paddingTop: 24, gap: 10 },
  halfLabel: { fontSize: 11, color: "#9b9b9b" },
  halfTitle: { fontSize: 15, lineHeight: 22, color: COLORS.primaryDark, fontWeight: "500" },
})
