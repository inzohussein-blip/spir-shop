import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Button from "../components/Button"
import Header from "../components/Header"
import Icon from "../components/Icon"
import PhotoPicker, { PickedPhoto } from "../components/PhotoPicker"
import Text from "../components/Text"
import ThanksModal from "../components/ThanksModal"
import { createReview, uploadImages } from "../lib/api"
import { COLORS, FONTS, RADIUS, SHADOW } from "../lib/config"
import { useStore } from "../lib/store"

/** Rate a product from a delivered order (design: "rate product"). */
export default function RateScreen() {
  const { product_id, order_id, title, stars } = useLocalSearchParams<{ product_id: string; order_id: string; title?: string; stars?: string }>()
  const router = useRouter()
  const { address } = useStore()
  const [rating, setRating] = useState(Number(stars) || 0)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState<PickedPhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!rating) return setError("اختاري عدد النجوم")
    setBusy(true)
    setError(null)
    try {
      const images = photos.length
        ? await uploadImages(order_id, photos.map((p) => ({ filename: p.name, mime_type: p.mime, content: p.base64 })))
        : undefined
      await createReview({ product_id, order_id, rating, name: address?.firstName?.trim() || "زبونة", comment: comment.trim() || undefined, images })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.pageAlt }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="تقييم المنتج" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 16, paddingBottom: 40, gap: 26 }}>
        <View style={styles.banner}>
          <Icon name="gift" size={22} color="#fff" />
          <Text style={styles.bannerText} numberOfLines={2}>
            {title ? `رأيك بـ «${title}» يساعد غيرك يختار` : "رأيك يساعد غيرك يختار"}
          </Text>
          <Icon name="chevron-left" size={20} color="#fff" />
        </View>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} testID={`star-${n}`}>
              <Text style={[styles.star, n <= rating && { color: COLORS.accent }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            placeholder="تحبين تكتبين شي عن المنتج؟"
            placeholderTextColor="#8a8a8f"
            style={styles.textarea}
            testID="review-comment"
          />
          <Text style={styles.counter}>{`${comment.length} حرف`}</Text>
        </View>
        <PhotoPicker photos={photos} onChange={setPhotos} />
        {error ? <Text style={{ color: COLORS.danger, textAlign: "center" }}>{error}</Text> : null}
        <Button label="إرسال التقييم" onPress={submit} loading={busy} testID="submit-review" />
      </ScrollView>
      <ThanksModal
        visible={done}
        title="شكراً على تقييمك!"
        body={"نقدّر رأيك، وراح يساعد غيرك\nيختار المنتج المناسب."}
        onDone={() => (router.canGoBack() ? router.back() : router.replace("/orders"))}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: COLORS.banner, borderRadius: RADIUS.card - 10, paddingHorizontal: 18, height: 56 },
  bannerText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
  stars: { flexDirection: "row", justifyContent: "center", gap: 12 },
  star: { fontSize: 44, color: "#b7bac9", lineHeight: 52 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, minHeight: 266, justifyContent: "space-between", ...SHADOW, shadowOpacity: 0.06 },
  textarea: {
    minHeight: 170,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlignVertical: "top",
    textAlign: Platform.OS === "web" ? "right" : "left",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
  counter: { fontSize: 12, color: "#8a8a8f", textAlign: Platform.OS === "web" ? "left" : "right" },
})
