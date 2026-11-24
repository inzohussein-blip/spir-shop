import { useEffect, useMemo, useState } from "react"
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Category, listCategories, Product } from "../lib/api"
import { COLORS } from "../lib/config"
import { DISCOUNT_OPTIONS, EMPTY_FILTERS, Filters, priceOf, productShades } from "../lib/filters"
import Dir from "./Dir"
import Icon from "./Icon"
import RangeSlider from "./RangeSlider"
import Text from "./Text"

const STEP = 1000

/**
 * Filter panel from the design: slides in from the side and covers most of the
 * screen. Price slider, shade colours, star rating, category and discount.
 */
export default function FilterSheet({
  visible,
  products,
  value,
  onApply,
  onClose,
}: {
  visible: boolean
  /** products being filtered: used for the price range and the available shades */
  products: Product[]
  value: Filters
  onApply: (f: Filters) => void
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState<Filters>(value)
  const [cats, setCats] = useState<Category[]>([])
  const [catOpen, setCatOpen] = useState(false)
  const [x] = useState(() => new Animated.Value(0))
  const width = Math.min(Dimensions.get("window").width - 72, 380)

  useEffect(() => {
    if (!visible) return
    setDraft(value)
    setCatOpen(false)
    listCategories().then(setCats).catch(() => undefined)
    Animated.timing(x, { toValue: 1, duration: 220, useNativeDriver: true }).start()
  }, [visible, value, x])

  const bounds = useMemo(() => {
    const prices = products.map(priceOf).filter((n) => n > 0)
    const lo = prices.length ? Math.floor(Math.min(...prices) / STEP) * STEP : 0
    const hi = prices.length ? Math.ceil(Math.max(...prices) / STEP) * STEP : 100000
    return { lo, hi: Math.max(hi, lo + STEP) }
  }, [products])

  const shades = useMemo(() => [...new Set(products.flatMap(productShades))].slice(0, 9), [products])

  const close = () => Animated.timing(x, { toValue: 0, duration: 160, useNativeDriver: true }).start(onClose)
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((i) => i !== v) : [...list, v])
  const cat = cats.find((c) => c.id === draft.categoryId)

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* physical left/right inside the modal (it renders outside the app's RTL root on web) */}
      <Dir dir="ltr" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: x }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          { width, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
          // RTL: mirrored design, the panel sits on the left edge
          { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] },
        ]}
      >
        <Dir dir="rtl" style={{ flex: 1 }}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>فلتر</Text>
          <Icon name="sliders" size={20} />
        </View>
        <ScrollView contentContainerStyle={{ gap: 26, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 14 }}>
            <Text style={styles.label}>السعر</Text>
            <RangeSlider
              min={bounds.lo}
              max={bounds.hi}
              step={STEP}
              low={draft.min ?? bounds.lo}
              high={draft.max ?? bounds.hi}
              onChange={(lo, hi) => set({ min: lo <= bounds.lo ? null : lo, max: hi >= bounds.hi ? null : hi })}
            />
          </View>

          {shades.length ? (
            <View style={{ gap: 14 }}>
              <Text style={styles.label}>اللون / الدرجة</Text>
              <View style={styles.row}>
                {shades.map((c) => (
                  <Pressable key={c} onPress={() => set({ shades: toggle(draft.shades, c) })} style={[styles.swatchRing, draft.shades.includes(c) && styles.swatchOn]} testID={`filter-shade-${c}`}>
                    <View style={[styles.swatch, { backgroundColor: c }]} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ gap: 14 }}>
            <Text style={styles.label}>التقييم</Text>
            <View style={[styles.row, { gap: 10 }]}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = draft.rating === n
                return (
                  <Pressable key={n} onPress={() => set({ rating: on ? 0 : n })} style={[styles.rate, on && styles.rateOn]} testID={`filter-rating-${n}`}>
                    <Text style={[styles.rateText, on && { color: COLORS.onStrong }]}>{`★ ${n}`}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={{ gap: 14 }}>
            <Text style={styles.label}>القسم</Text>
            <Pressable style={styles.select} onPress={() => setCatOpen(!catOpen)} testID="filter-category">
              <Icon name="tag" size={16} />
              <Text style={{ flex: 1, fontSize: 14 }}>{cat?.name ?? "كل الأقسام"}</Text>
              <Icon name={catOpen ? "chevron-up" : "chevron-down"} size={18} />
            </Pressable>
            {catOpen ? (
              <View style={styles.options}>
                {[{ id: "", name: "كل الأقسام" } as Category, ...cats].map((c) => (
                  <Pressable
                    key={c.id || "all"}
                    style={styles.option}
                    onPress={() => {
                      set({ categoryId: c.id || null })
                      setCatOpen(false)
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: (draft.categoryId ?? "") === c.id ? "700" : "400" }}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ gap: 14 }}>
            <Text style={styles.label}>الخصم</Text>
            <View style={[styles.row, { flexWrap: "wrap", gap: 10 }]}>
              {DISCOUNT_OPTIONS.map((d) => {
                const on = draft.discounts.includes(d)
                return (
                  <Pressable key={d} onPress={() => set({ discounts: toggle(draft.discounts, d) })} style={[styles.chip, on && styles.chipOn]} testID={`filter-discount-${d}`}>
                    <Text style={[styles.chipText, on && { color: COLORS.onStrong }]}>{`خصم ${d}%+`}</Text>
                    {on ? <Icon name="x" size={14} color={COLORS.onStrong} /> : null}
                  </Pressable>
                )
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.foot}>
          <Pressable onPress={() => setDraft(EMPTY_FILTERS)} hitSlop={8} testID="reset-filter">
            <Text style={{ fontSize: 15 }}>إعادة ضبط</Text>
          </Pressable>
          <Pressable
            style={styles.apply}
            onPress={() => {
              onApply(draft)
              close()
            }}
            testID="apply-filter"
          >
            <Text style={styles.applyText}>تطبيق</Text>
          </Pressable>
        </View>
        </Dir>
      </Animated.View>
      </Dir>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.4)" },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.card,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 26,
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headTitle: { fontSize: 20, fontWeight: "700" },
  label: { fontSize: 15, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  swatchRing: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  swatchOn: { borderWidth: 1.5, borderColor: COLORS.primaryDark },
  swatch: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  rate: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryDark, alignItems: "center", justifyContent: "center" },
  rateOn: { backgroundColor: COLORS.strong, borderColor: COLORS.strong },
  rateText: { fontSize: 11, fontWeight: "700" },
  select: { flexDirection: "row", alignItems: "center", gap: 10, height: 40, borderRadius: 20, borderWidth: 1, borderColor: "#d8d8d8", paddingHorizontal: 16 },
  options: { borderWidth: 1, borderColor: "#eee", borderRadius: 14, paddingVertical: 4, marginTop: -6 },
  option: { paddingHorizontal: 16, paddingVertical: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.primaryDark },
  chipOn: { backgroundColor: COLORS.strong, borderColor: COLORS.strong },
  chipText: { fontSize: 13 },
  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12 },
  apply: { backgroundColor: COLORS.strong, height: 44, width: 120, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  applyText: { color: COLORS.onStrong, fontSize: 15, fontWeight: "700" },
})
