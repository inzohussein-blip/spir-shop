import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEventListener } from "expo"
import { useVideoPlayer, VideoView } from "expo-video"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Text from "../components/Text"
import { listStories, Story } from "../lib/api"
import { openLink } from "../lib/links"
import { getCachedStories } from "../sdui/blocks/media"

const IMAGE_DURATION_MS = 5000
const TICK_MS = 50

/** Full-screen story viewer: tap sides to navigate, auto-advance, shop button. */
export default function StoriesScreen() {
  const { start } = useLocalSearchParams<{ start?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [stories, setStories] = useState<Story[] | null>(getCachedStories())
  const [index, setIndex] = useState(Number(start ?? 0) || 0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!stories) listStories().then(setStories).catch(() => router.back())
  }, [stories, router])

  const story = stories?.[index]

  const next = useCallback(() => {
    if (!stories) return
    if (index + 1 < stories.length) {
      setIndex(index + 1)
      setProgress(0)
    } else {
      router.back()
    }
  }, [index, stories, router])

  const prev = () => {
    setIndex(Math.max(0, index - 1))
    setProgress(0)
  }

  // Image stories advance on a timer; video stories follow the video's progress
  useEffect(() => {
    if (!story || story.media_type !== "image" || paused) return
    const t = setInterval(() => {
      setProgress((p) => {
        const n = p + TICK_MS / IMAGE_DURATION_MS
        return n >= 1 ? 1 : n
      })
    }, TICK_MS)
    return () => clearInterval(t)
  }, [story, paused])

  useEffect(() => {
    if (progress >= 1) next()
  }, [progress, next])

  if (!stories || !story) {
    return (
      <View style={[styles.root, { justifyContent: "center" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {story.media_type === "video" ? (
        <StoryVideo key={story.id} url={story.media_url} paused={paused} onProgress={setProgress} onEnd={next} />
      ) : (
        <Image source={story.media_url} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}

      {/* Tap zones: in RTL the "next" side is the left one */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={prev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          testID="story-prev"
        />
        <Pressable
          style={{ flex: 1 }}
          onPress={next}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          testID="story-next"
        />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.bars}>
          {stories.map((s, i) => (
            <View key={s.id} style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }]}
              />
            </View>
          ))}
        </View>
        <View style={styles.header}>
          <Text style={styles.storyTitle}>{story.title}</Text>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="story-close">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
      </View>

      {story.link ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]} pointerEvents="box-none">
          <Pressable
            style={styles.cta}
            onPress={() => {
              router.back()
              openLink(router, story.link)
            }}
            testID="story-cta"
          >
            <Text style={styles.ctaText}>{story.cta_label || "تسوّقي الآن"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

function StoryVideo({
  url,
  paused,
  onProgress,
  onEnd,
}: {
  url: string
  paused: boolean
  onProgress: (p: number) => void
  onEnd: () => void
}) {
  const player = useVideoPlayer(url, (p) => {
    p.timeUpdateEventInterval = 0.1
    p.play()
  })
  const endedRef = useRef(false)

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    if (player.duration > 0) onProgress(Math.min(currentTime / player.duration, 0.99))
  })
  useEventListener(player, "playToEnd", () => {
    if (!endedRef.current) {
      endedRef.current = true
      onEnd()
    }
  })

  useEffect(() => {
    if (paused) player.pause()
    else player.play()
  }, [paused, player])

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  top: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 10, gap: 10 },
  bars: { flexDirection: "row", gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.35)", overflow: "hidden" },
  barFill: { height: 3, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storyTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  close: { color: "#fff", fontSize: 22 },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  cta: { backgroundColor: "#fff", borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12 },
  ctaText: { color: "#000", fontWeight: "700", fontSize: 15 },
})
