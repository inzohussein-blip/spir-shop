import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { openLink } from "../../lib/links"
import { BlockProps, num, str } from "../types"

export function HeroBanner({ props }: BlockProps) {
  const router = useRouter()
  const image = str(props.image_url)
  const textColor = str(props.text_color, COLORS.primaryDark)
  const link = str(props.link)
  return (
    <Pressable
      onPress={() => openLink(router, link)}
      disabled={!link}
      style={[styles.hero, { backgroundColor: str(props.background_color, COLORS.soft) }]}
    >
      {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <View style={styles.heroContent}>
        {str(props.title) ? (
          <Text style={[styles.heroTitle, { color: textColor }]}>{str(props.title)}</Text>
        ) : null}
        {str(props.subtitle) ? (
          <Text style={[styles.heroSub, { color: textColor }]}>{str(props.subtitle)}</Text>
        ) : null}
        {str(props.cta_label) && link ? (
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{str(props.cta_label)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

export function Heading({ props }: BlockProps) {
  const router = useRouter()
  const align = str(props.align, "start")
  const link = str(props.link)
  const text = (
    <Text
      style={[
        styles.heading,
        align === "center" ? { textAlign: "center" } : null,
        { fontSize: num(props.size, 20) },
      ]}
    >
      {str(props.text)}
    </Text>
  )
  if (!link) return text
  // Section title with "View all" (design: "Top Collection   Show all")
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -12 }}>
      {text}
      <Pressable onPress={() => openLink(router, link)} hitSlop={8}>
        <Text style={{ color: "#9b9b9b", fontSize: 13 }}>عرض الكل</Text>
      </Pressable>
    </View>
  )
}

export function Spacer({ props }: BlockProps) {
  return <View style={{ height: Math.min(num(props.height, 16), 200) }} />
}

const pad = (n: number) => String(n).padStart(2, "0")

export function CountdownOffer({ props }: BlockProps) {
  const router = useRouter()
  const endsAt = new Date(str(props.ends_at)).getTime()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const left = endsAt - now
  // Expired or invalid date: the offer disappears by itself
  if (!Number.isFinite(endsAt) || left <= 0) return null

  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const bg = str(props.background_color, COLORS.primary)

  return (
    <Pressable style={[styles.offer, { backgroundColor: bg }]} onPress={() => openLink(router, str(props.link))}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.offerTitle}>{str(props.title)}</Text>
        {str(props.subtitle) ? <Text style={styles.offerSub}>{str(props.subtitle)}</Text> : null}
      </View>
      <View style={styles.timer} testID="countdown">
        <Text style={styles.timerText}>{`${pad(h)}:${pad(m)}:${pad(s)}`}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: { borderRadius: 12, overflow: "hidden", height: 170, justifyContent: "center" },
  heroContent: { padding: 22, gap: 4, maxWidth: "70%" },
  heroTitle: { fontSize: 26, fontWeight: "700", lineHeight: 34 },
  heroSub: { fontSize: 14 },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 10,
  },
  ctaText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  heading: { fontWeight: "700", color: COLORS.text },
  offer: { borderRadius: 12, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  offerTitle: { color: "#fff", fontWeight: "700", fontSize: 17 },
  offerSub: { color: "#fff", opacity: 0.9 },
  timer: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  timerText: { color: "#fff", fontWeight: "700", fontSize: 18, fontVariant: ["tabular-nums"] },
})
