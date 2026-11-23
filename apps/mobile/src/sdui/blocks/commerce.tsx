import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Icon, { IconName } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { getSale, listProducts, Product, Sale } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { openLink } from "../../lib/links"
import { useStore } from "../../lib/store"
import { BlockProps, num, str } from "../types"

type Slide = { title?: string; subtitle?: string; image_url?: string; link?: string; background_color?: string; text_color?: string }

/** Several banners that slide automatically, with page dots. */
export function HeroCarousel({ props }: BlockProps) {
  const router = useRouter()
  const slides = (Array.isArray(props.slides) ? props.slides : []) as Slide[]
  const interval = Math.max(2, num(props.interval, 5)) * 1000
  const [width, setWidth] = useState(0)
  const [index, setIndex] = useState(0)
  const ref = useRef<{ scrollTo: (o: { x: number; animated: boolean }) => void } | null>(null)

  useEffect(() => {
    if (slides.length < 2 || !width) return
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length
        ref.current?.scrollTo({ x: next * width, animated: true })
        return next
      })
    }, interval)
    return () => clearInterval(t)
  }, [slides.length, width, interval])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width) setIndex(Math.round(Math.abs(e.nativeEvent.contentOffset.x) / width))
  }

  if (!slides.length) return null
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref as never}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ borderRadius: 12 }}
      >
        {slides.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => openLink(router, s.link)}
            style={[styles.slide, { width: width || 1, backgroundColor: s.background_color || COLORS.soft }]}
            testID={`slide-${i}`}
          >
            {s.image_url ? <Image source={s.image_url} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <View style={styles.slideText}>
              {s.subtitle ? <Text style={[styles.slideSub, { color: s.text_color || COLORS.text }]}>{s.subtitle}</Text> : null}
              {s.title ? <Text style={[styles.slideTitle, { color: s.text_color || COLORS.text }]}>{s.title}</Text> : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const TRUST_ICONS: IconName[] = ["shield", "truck", "dollar-sign", "star"]

/** Trust badges from the app settings (original products, delivery, cash on delivery). */
export function TrustStrip(_: BlockProps) {
  const { settings } = useStore()
  const badges = settings.trust_badges.slice(0, 3)
  if (!badges.length) return null
  return (
    <View style={styles.trust}>
      {badges.map((b, i) => (
        <View key={b} style={styles.trustItem}>
          <Icon name={TRUST_ICONS[i]} size={16} color={COLORS.accent} />
          <Text style={styles.trustText} numberOfLines={2}>
            {b}
          </Text>
        </View>
      ))}
    </View>
  )
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0")

/** Deals of the day: products of the active sale price list, with a countdown. */
export function FlashSale({ props }: BlockProps) {
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null | undefined>(undefined)
  const [products, setProducts] = useState<Product[]>([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    getSale()
      .then(async (s) => {
        setSale(s)
        if (s?.product_ids.length) setProducts(await listProducts({ ids: s.product_ids, limit: 20 }))
      })
      .catch(() => setSale(null))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (sale === undefined) return <ActivityIndicator color={COLORS.primary} />
  if (!sale || !products.length) return null
  const left = sale.ends_at ? new Date(sale.ends_at).getTime() - now : null
  if (left !== null && left <= 0) return null

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.saleHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.saleTitle}>{str(props.title) || sale.title}</Text>
          {left !== null ? (
            <View style={styles.timer} testID="sale-countdown">
              <Text style={styles.timerText}>
                {`${pad(Math.floor(left / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => router.push({ pathname: "/category/[id]", params: { id: "all", sale: "1" } })}>
          <Text style={styles.more}>عرض الكل</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 2 }}>
        {products.map((p) => (
          <View key={p.id} style={{ width: 156 }}>
            <ProductCard product={p} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  // Banner from the design: photo filling the card, big white title on the opposite side
  slide: { height: 168, justifyContent: "center", alignItems: "flex-end", overflow: "hidden" },
  slideText: { padding: 22, gap: 4, maxWidth: "58%" },
  slideTitle: { fontSize: 25, fontWeight: "700", lineHeight: 34 },
  slideSub: { fontSize: 13 },
  dots: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)" },
  dotActive: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.25)", width: 8, height: 8, borderRadius: 4, marginTop: -1 },
  trust: { flexDirection: "row", gap: 8 },
  trustItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  trustText: { fontSize: 11, fontWeight: "700", flex: 1 },
  saleHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  saleTitle: { fontSize: 20, fontWeight: "700" },
  timer: { backgroundColor: COLORS.danger, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  timerText: { color: "#fff", fontWeight: "700", fontSize: 13, fontVariant: ["tabular-nums"] },
  more: { color: COLORS.muted, fontSize: 13 },
})
