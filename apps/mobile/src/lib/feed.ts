/**
 * "Scrolled near the bottom" signal from a screen to the endless product feed
 * inside it (the feed is a block among others in the home ScrollView).
 */
type Listener = () => void
const listeners = new Set<Listener>()

export function onNearEnd(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitNearEnd() {
  listeners.forEach((l) => l())
}

/** onScroll handler for a ScrollView hosting a feed: fires within ~1.5 screens of the end. */
export function nearEndHandler(e: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
  if (layoutMeasurement.height + contentOffset.y >= contentSize.height - layoutMeasurement.height * 1.5) emitNearEnd()
}
