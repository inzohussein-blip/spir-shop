import { ReactNode, useCallback, useMemo, useRef, useState } from "react"
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native"
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg"

/**
 * "Child's hand pulling a sheet" pull-to-refresh:
 *  1. pull the page down: a grey gap opens and a cartoon hand comes down into it
 *  2. let go past the threshold: the hand closes into a fist and grabs the page,
 *     folds spread around the fist like cloth
 *  3. while the data reloads the hand holds the page, then pulls it back up,
 *     the folds stretch and fade, and the page settles with a small bounce
 */

const THRESHOLD = 96
const HOLD = 118
const MAX_PULL = 190
const HAND_W = 112
const HAND_H = 190
const FOLD_H = 230

const SKIN = "#f4b4a2"
const SKIN_DARK = "#e48f7c"
const SKIN_LIGHT = "#fcd3c6"

/** Arm and hand seen from above. `fist` swaps the open fingers for a closed fist. */
function HandArt({ fist }: { fist: boolean }) {
  return (
    <Svg width={HAND_W} height={HAND_H} viewBox="0 0 112 190">
      <Defs>
        <LinearGradient id="arm" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={SKIN_DARK} />
          <Stop offset="0.45" stopColor={SKIN_LIGHT} />
          <Stop offset="1" stopColor={SKIN_DARK} />
        </LinearGradient>
        <RadialGradient id="palm" cx="0.42" cy="0.35" r="0.75">
          <Stop offset="0" stopColor={SKIN_LIGHT} />
          <Stop offset="0.7" stopColor={SKIN} />
          <Stop offset="1" stopColor={SKIN_DARK} />
        </RadialGradient>
        <RadialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* soft shadow on the page under the hand */}
      <Ellipse cx="56" cy="176" rx="40" ry="10" fill="url(#shadow)" />
      {/* arm coming from the top of the screen */}
      <Rect x="33" y="0" width="46" height="120" rx="22" fill="url(#arm)" />
      {fist ? (
        <G>
          {/* closed fist: round palm with four knuckles and the thumb across */}
          <Rect x="22" y="104" width="68" height="62" rx="28" fill="url(#palm)" />
          <Circle cx="34" cy="160" r="10" fill={SKIN} />
          <Circle cx="50" cy="165" r="10.5" fill={SKIN} />
          <Circle cx="66" cy="165" r="10.5" fill={SKIN} />
          <Circle cx="80" cy="159" r="9.5" fill={SKIN} />
          <Path d="M40 158 Q46 152 52 158 M57 160 Q63 154 69 160 M73 157 Q78 152 83 156" stroke={SKIN_DARK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Path d="M24 128 Q30 146 52 146 Q60 146 62 140" stroke={SKIN_DARK} strokeWidth="2" fill="none" strokeLinecap="round" />
          <Ellipse cx="44" cy="120" rx="14" ry="7" fill="#fff" opacity="0.25" />
        </G>
      ) : (
        <G>
          {/* open hand reaching down: palm, four fingers and the thumb */}
          <Rect x="27" y="104" width="58" height="50" rx="24" fill="url(#palm)" />
          <Rect x="27" y="134" width="13" height="34" rx="6.5" fill={SKIN} />
          <Rect x="41" y="140" width="13" height="38" rx="6.5" fill={SKIN} />
          <Rect x="56" y="140" width="13" height="38" rx="6.5" fill={SKIN} />
          <Rect x="70" y="135" width="12" height="32" rx="6" fill={SKIN} />
          <Path d="M27 118 Q12 128 14 146 Q16 154 24 150 Q26 136 34 130 Z" fill={SKIN} />
          <Ellipse cx="48" cy="118" rx="14" ry="7" fill="#fff" opacity="0.28" />
          <Path d="M40 150 L40 162 M54 154 L54 168 M69 154 L69 166" stroke={SKIN_DARK} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  )
}

/** Creases radiating from the grab point, like a sheet pinched in the middle. */
function Folds({ width }: { width: number }) {
  const cx = width / 2
  const paths = useMemo(() => {
    // each crease = a dark side and a light side; drawn in 3 widths for a soft, cloth-like edge
    const out: { shade: string; light: string; o: number }[] = []
    const n = 12
    for (let i = 0; i < n; i++) {
      const up = i % 4 === 3
      const a = up ? (-160 + ((i * 47) % 140)) * (Math.PI / 180) : (8 + (i * 164) / (n - 1)) * (Math.PI / 180)
      const len = up ? 46 + (i % 3) * 14 : 120 + ((i * 41) % 90)
      const bend = (i % 2 ? 1 : -1) * 16
      const mx = cx + Math.cos(a) * len * 0.5 + Math.cos(a + Math.PI / 2) * bend
      const my = 14 + Math.sin(a) * len * 0.5 + Math.sin(a + Math.PI / 2) * bend
      const ex = cx + Math.cos(a) * len
      const ey = 14 + Math.sin(a) * len
      for (const k of [3, 2, 1]) {
        const w = (up ? 3 : 5) * k
        const nx = Math.cos(a + Math.PI / 2) * w
        const ny = Math.sin(a + Math.PI / 2) * w
        const wedge = (dx: number, dy: number) => `M${cx} 14 Q${mx + dx} ${my + dy} ${ex} ${ey} Q${mx} ${my} ${cx} 14 Z`
        out.push({ shade: wedge(nx, ny), light: wedge(-nx, -ny), o: (up ? 0.5 : 1) * (k === 1 ? 0.55 : k === 2 ? 0.3 : 0.16) })
      }
    }
    return out
  }, [cx])
  return (
    <Svg width={width} height={FOLD_H}>
      <Defs>
        <RadialGradient id="foldShade" cx={cx} cy="14" r="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#8a8a8a" stopOpacity="0.9" />
          <Stop offset="0.55" stopColor="#9a9a9a" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#9a9a9a" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="foldLight" cx={cx} cy="14" r="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <Stop offset="0.6" stopColor="#ffffff" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pinch" cx={cx} cy="14" r="60" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy="14" rx="70" ry="40" fill="url(#pinch)" />
      {paths.map((p, i) => (
        <G key={i} opacity={p.o}>
          <Path d={p.shade} fill="url(#foldShade)" />
          <Path d={p.light} fill="url(#foldLight)" />
        </G>
      ))}
    </Svg>
  )
}

type Props = Omit<ScrollViewProps, "refreshControl"> & {
  onRefresh: () => Promise<unknown>
  children: ReactNode
}

/** ScrollView with the hand pull-to-refresh. */
export default function HandRefresh({ onRefresh, children, onScroll, ...scrollProps }: Props) {
  const { width } = useWindowDimensions()
  const pull = useRef(new Animated.Value(0)).current // how far the page is pulled down
  const handY = useRef(new Animated.Value(-HAND_H)).current // top of the hand
  const fold = useRef(new Animated.Value(0)).current // 0 = flat page, 1 = folds
  const stretch = useRef(new Animated.Value(1)).current // folds stretching while pulled up
  const [fist, setFist] = useState(false)
  const scrollY = useRef(0)
  const busy = useRef(false)

  const rubber = (dy: number) => Math.min(MAX_PULL, dy < 0 ? 0 : dy * 0.55)

  const springBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(pull, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      Animated.timing(handY, { toValue: -HAND_H, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [pull, handY])

  const run = useCallback(async () => {
    busy.current = true
    const native = { useNativeDriver: true }
    // hand comes down into the gap and grabs the top of the page
    await new Promise<void>((done) =>
      Animated.parallel([
        Animated.timing(pull, { toValue: HOLD, duration: 160, ...native }),
        Animated.timing(handY, { toValue: HOLD - HAND_H + 22, duration: 300, easing: Easing.out(Easing.back(1.6)), ...native }),
      ]).start(() => done())
    )
    setFist(true)
    stretch.setValue(1)
    const loading = Promise.all([onRefresh().catch(() => undefined), new Promise((r) => setTimeout(r, 650))])
    Animated.timing(fold, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), ...native }).start()
    // small tug while the data loads
    const tug = Animated.loop(
      Animated.sequence([
        Animated.timing(pull, { toValue: HOLD + 8, duration: 260, easing: Easing.inOut(Easing.sin), ...native }),
        Animated.timing(pull, { toValue: HOLD, duration: 260, easing: Easing.inOut(Easing.sin), ...native }),
      ])
    )
    tug.start()
    await loading
    tug.stop()
    // pull the sheet back up: page, hand and folds move together, folds stretch and fade
    await new Promise<void>((done) =>
      Animated.parallel([
        Animated.timing(pull, { toValue: -14, duration: 420, easing: Easing.in(Easing.cubic), ...native }),
        Animated.timing(handY, { toValue: -HAND_H - 40, duration: 460, easing: Easing.in(Easing.cubic), ...native }),
        Animated.timing(stretch, { toValue: 1.7, duration: 420, ...native }),
        Animated.timing(fold, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), ...native }),
      ]).start(() => done())
    )
    setFist(false)
    // settle with a little bounce
    Animated.spring(pull, { toValue: 0, velocity: 2, bounciness: 12, speed: 14, ...native }).start(() => {
      busy.current = false
    })
  }, [pull, handY, fold, stretch, onRefresh])

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => !busy.current && scrollY.current <= 0 && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
        onPanResponderMove: (_, g) => {
          const p = rubber(g.dy)
          pull.setValue(p)
          // the open hand follows the gap down
          handY.setValue(Math.min(p - HAND_H + 8, HOLD - HAND_H + 22))
        },
        onPanResponderRelease: (_, g) => (rubber(g.dy) >= THRESHOLD ? run() : springBack()),
        onPanResponderTerminate: () => springBack(),
        onPanResponderTerminationRequest: () => false,
      }),
    [pull, handY, run, springBack]
  )

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y
    onScroll?.(e)
  }

  return (
    <View style={styles.wrap} {...responder.panHandlers} testID="hand-refresh">
      <Animated.View style={[styles.page, { transform: [{ translateY: pull }] }]}>
        <ScrollView {...scrollProps} onScroll={handleScroll} scrollEventThrottle={16} bounces={false} overScrollMode="never">
          {children}
        </ScrollView>
        <Animated.View
          pointerEvents="none"
          style={[styles.folds, { opacity: fold, transform: [{ translateY: -14 }, { scaleY: stretch }, { translateY: 14 }] }]}
        >
          <Folds width={width} />
        </Animated.View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.hand, { left: width / 2 - HAND_W / 2, transform: [{ translateY: handY }] }]}>
        <HandArt fist={fist} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  // the grey "under the sheet" colour shows in the gap
  wrap: { flex: 1, overflow: "hidden", backgroundColor: "#e9e9ea", ...(Platform.OS === "web" ? ({ userSelect: "none" } as object) : {}) },
  page: { flex: 1, backgroundColor: "#fff" },
  folds: { position: "absolute", top: 0, left: 0, right: 0, height: FOLD_H },
  hand: { position: "absolute", top: 0 },
})
