import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useVideoPlayer, VideoView } from "expo-video"
import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { listStories, Story } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { openLink } from "../../lib/links"
import { BlockProps, bool, str } from "../types"

let storiesCache: Story[] | null = null
export const getCachedStories = () => storiesCache

/** Instagram-style circles; tapping opens the full-screen story viewer. */
export function StoryBar({ props }: BlockProps) {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>(storiesCache ?? [])

  useEffect(() => {
    listStories()
      .then((s) => {
        storiesCache = s
        setStories(s)
      })
      .catch(() => undefined)
  }, [])

  if (!stories.length) return null
  return (
    <View style={{ gap: 8 }}>
      {str(props.title) ? <Text style={styles.title}>{str(props.title)}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
        {stories.map((s, i) => {
          const thumb = s.thumbnail_url || (s.media_type === "image" ? s.media_url : null)
          return (
            <Pressable
              key={s.id}
              style={styles.story}
              onPress={() => router.push({ pathname: "/stories", params: { start: String(i) } })}
              testID={`story-${i}`}
            >
              <View style={styles.ring}>
                {thumb ? (
                  <Image source={thumb} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.videoAvatar]}>
                    <Text style={{ color: "#fff", fontSize: 18 }}>▶</Text>
                  </View>
                )}
              </View>
              <Text style={styles.storyTitle} numberOfLines={1}>
                {s.title}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export function VideoBanner({ props }: BlockProps) {
  const router = useRouter()
  const url = str(props.video_url)
  const player = useVideoPlayer(url || null, (p) => {
    p.loop = true
    p.muted = true
    if (bool(props.autoplay, true)) p.play()
  })
  if (!url) return null
  return (
    <Pressable style={styles.video} onPress={() => openLink(router, str(props.link))}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      {str(props.title) ? (
        <View style={styles.videoCaption}>
          <Text style={styles.videoTitle}>{str(props.title)}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700" },
  story: { alignItems: "center", width: 72, gap: 4 },
  ring: { padding: 2, borderRadius: 40, borderWidth: 2, borderColor: COLORS.primary },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.soft },
  videoAvatar: { backgroundColor: COLORS.primaryDark, alignItems: "center", justifyContent: "center" },
  storyTitle: { fontSize: 11, textAlign: "center" },
  video: { height: 220, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  videoCaption: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: "rgba(0,0,0,0.35)" },
  videoTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
