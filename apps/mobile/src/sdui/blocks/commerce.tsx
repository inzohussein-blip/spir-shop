import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Icon, { IconName } from "../../components/Icon"
import ProductCard from "../../components/ProductCard"
import Text from "../../components/Text"
import { getSale, listProducts, Product, Sale } from "../../lib/api"
import { COLORS, IS_NATURAL } from "../../lib/config"
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
        style={{ borderRadius: IS_NATURAL ? 22 : 12 }}
      >
        {slides.map((s, i) =>
          IS_NATURAL ? (
            // natural theme: green card, small black tag, dark title, black "shop now" pill, photo on the side
            <Pressable key={i} onPress={() => openLink(router, s.link)} style={[styles.green, { width: width || 1 }]} testID={`slide-${i}`}>
              <View style={styles.greenText}>
                {s.subtitle ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText} numberOfLines={1}>{s.subtitle}</Text>
                  </View>
                ) : null}
                {s.title ? <Text style={styles.greenTitle} numberOfLines={3}>{s.title.replace(/\n/g, " ")}</Text> : null}
                <View style={styles.shop}>
                  <Text style={styles.shopText}>تسوّقي الآن</Text>
                  <View style={styles.shopArrow}>
                    <Icon name="arrow-up-left" size={14} color={COLORS.dark} />
                  </View>
                </View>
              </View>
              {s.image_url ? <Image source={s.image_url} style={styles.greenImage} contentFit="cover" /> : null}
            </Pressable>
          ) : (
          <Pressable
            key={i}
            onPress={() => openLink(router, s.link)}
            style={[styles.slide, { width: width || 1, backgroundColor: s.background_color || COLORS.soft }, s.image_url && !s.title ? { height: Math.round((width || 1) / 2) } : null]}
            testID={`slide-${i}`}
          >
            {s.image_url ? <Image source={s.image_url} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            <View style={styles.slideText}>
              {s.subtitle ? <Text style={[styles.slideSub, { color: s.text_color || COLORS.text }]}>{s.subtitle}</Text> : null}
              {s.title ? <Text style={[styles.slideTitle, { color: s.text_color || COLORS.text }]}>{s.title}</Text> : null}
            </View>
          </Pressable>
          )
        )}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={IS_NATURAL ? styles.dotsBelow : styles.dots} pointerEvents="none">
          {slides.map((_, i) => (
            <View key={i} style={IS_NATURAL ? [styles.gDot, i === index && styles.gDotOn] : [styles.dot, i === index && styles.dotActive]} />
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

  const h = left !== null ? Math.floor(left / 3600000) : 0
  const parts = left !== null ? [h, Math.floor((left % 3600000) / 60000), Math.floor((left % 60000) / 1000)] : []
  return (
    <View style={styles.saleBox}>
      <View style={styles.saleHead}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
          <Icon name="zap" size={18} color={COLORS.sale} />
          <Text style={styles.saleTitle} numberOfLines={1}>{str(props.title) || sale.title}</Text>
        </View>
        <Pressable onPress={() => router.push({ pathname: "/category/[id]", params: { id: "all", sale: "1" } })} hitSlop={8}>
          <Text style={styles.more}>عرض الكل ‹</Text>
        </Pressable>
      </View>
      {left !== null ? (
        <View style={styles.timerRow} testID="sale-countdown">
          <Text style={styles.endsIn}>ينتهي خلال</Text>
          {h >= 24 ? (
            <>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{Math.floor(h / 24)}</Text>
              </View>
              <Text style={styles.endsIn}>يوم</Text>
            </>
          ) : null}
          {/* hours:minutes:seconds always read left to right */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, direction: "ltr" }}>
          {[h % 24, parts[1], parts[2]].map((n, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              {i ? <Text style={styles.colon}>:</Text> : null}
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{pad(n)}</Text>
              </View>
            </View>
          ))}
          </View>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 10 }} style={{ marginHorizontal: -10 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="mini" />
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
  green: { height: 160, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  greenText: { flex: 1, paddingHorizontal: 18, gap: 8, alignItems: "flex-start" },
  tag: { backgroundColor: COLORS.dark, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { color: "#fff", fontSize: 11 },
  greenTitle: { color: COLORS.onPrimary, fontSize: 17, fontWeight: "700", lineHeight: 25 },
  shop: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.dark, borderRadius: 22, height: 40, paddingStart: 16, paddingEnd: 6, marginTop: 2 },
  shopText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  shopArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  greenImage: { width: 140, height: 136, borderRadius: 18, marginEnd: 12 },
  dotsBelow: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  gDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d6d8d2" },
  gDotOn: { width: 20, backgroundColor: COLORS.primary },
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
  saleBox: { backgroundColor: COLORS.saleSoft, borderRadius: 12, padding: 12, gap: 10 },
  saleHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saleTitle: { fontSize: 17, fontWeight: "700" },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  endsIn: { fontSize: 12, color: COLORS.text, marginEnd: 2 },
  timeBox: { backgroundColor: COLORS.dark, borderRadius: 4, minWidth: 24, paddingHorizontal: 4, paddingVertical: 2, alignItems: "center" },
  timeText: { color: COLORS.onDark, fontWeight: "700", fontSize: 12, fontVariant: ["tabular-nums"] },
  colon: { fontWeight: "700", color: COLORS.dark },
  timer: { backgroundColor: COLORS.danger, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  timerText: { color: "#fff", fontWeight: "700", fontSize: 13, fontVariant: ["tabular-nums"] },
  more: { color: COLORS.muted, fontSize: 13 },
})
