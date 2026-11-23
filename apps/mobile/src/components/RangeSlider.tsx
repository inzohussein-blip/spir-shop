import { useRef, useState } from "react"
import { PanResponder, StyleSheet, View } from "react-native"
import { COLORS } from "../lib/config"
import { formatIqd } from "../lib/format"
import Dir from "./Dir"
import Text from "./Text"

const THUMB = 20

/**
 * Two-thumb price slider (design's filter panel). Laid out left-to-right like
 * the design, lower price on the left.
 */
export default function RangeSlider({
  min,
  max,
  low,
  high,
  step = 1000,
  onChange,
}: {
  min: number
  max: number
  low: number
  high: number
  step?: number
  onChange: (low: number, high: number) => void
}) {
  const [width, setWidth] = useState(0)
  const track = Math.max(1, width - THUMB)
  const toX = (v: number) => ((v - min) / Math.max(1, max - min)) * track
  const toV = (x: number) => Math.round((min + (Math.min(Math.max(x, 0), track) / track) * (max - min)) / step) * step

  // Latest values for the gesture handlers
  const state = useRef({ low, high, track, startX: 0 })
  state.current.low = low
  state.current.high = high
  state.current.track = track

  const makePan = (which: "low" | "high") =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const s = state.current
        s.startX = toX(which === "low" ? s.low : s.high)
      },
      onPanResponderMove: (_, g) => {
        const s = state.current
        const v = toV(s.startX + g.dx)
        if (which === "low") onChange(Math.min(v, s.high - step), s.high)
        else onChange(s.low, Math.max(v, s.low + step))
      },
    })
  const lowPan = useRef(makePan("low"))
  const highPan = useRef(makePan("high"))
  // Re-create when the width changes so toX/toV use the new size
  const lastWidth = useRef(0)
  if (lastWidth.current !== width) {
    lastWidth.current = width
    lowPan.current = makePan("low")
    highPan.current = makePan("high")
  }

  const xl = toX(low)
  const xh = toX(high)
  return (
    <Dir dir="ltr" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} testID="price-slider">
      <View style={styles.area}>
        <View style={styles.track} />
        <View style={[styles.active, { width: Math.max(0, xh - xl), transform: [{ translateX: xl + THUMB / 2 }] }]} />
        <View {...lowPan.current.panHandlers} style={[styles.thumb, { transform: [{ translateX: xl }] }]} testID="price-low" />
        <View {...highPan.current.panHandlers} style={[styles.thumb, { transform: [{ translateX: xh }] }]} testID="price-high" />
      </View>
      <View style={{ height: 18 }}>
        <Text style={[styles.label, { transform: [{ translateX: Math.max(0, xl - 10) }] }]}>{formatIqd(low)}</Text>
        <Text style={[styles.label, { transform: [{ translateX: Math.min(Math.max(0, xh - 30), width - 80) }] }]}>{formatIqd(high)}</Text>
      </View>
    </Dir>
  )
}

const styles = StyleSheet.create({
  area: { height: 28, justifyContent: "center" },
  track: { position: "absolute", left: THUMB / 2, right: THUMB / 2, height: 2, backgroundColor: "#e5e5e5" },
  active: { position: "absolute", left: 0, height: 2, backgroundColor: COLORS.primaryDark },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
  },
  label: { position: "absolute", left: 0, fontSize: 11, fontWeight: "700" },
})
