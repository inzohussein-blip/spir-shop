import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Button from "../components/Button"
import Text from "../components/Text"
import { createReview } from "../lib/api"
import { COLORS, FONTS, RADIUS, SHADOW } from "../lib/config"
import { useStore } from "../lib/store"

const LABELS = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"]

/** Rate a product from a delivered order (verified purchase). */
export default function RateScreen() {
  const { product_id, order_id, title } = useLocalSearchParams<{ product_id: string; order_id: string; title?: string }>()
  const router = useRouter()
  const { address } = useStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [name, setName] = useState(address?.firstName ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!rating) return setError("اختاري عدد النجوم")
    if (!name.trim()) return setError("اكتبي اسمك")
    setBusy(true)
    setError(null)
    try {
      await createReview({ product_id, order_id, rating, name: name.trim(), comment: comment.trim() || undefined })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <View style={styles.done}>
        <Text style={{ fontSize: 48, color: "#e2a93b" }}>★</Text>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>شكراً على تقييمك!</Text>
        <Button label="رجوع" onPress={() => (router.canGoBack() ? router.back() : router.replace("/orders"))} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f9f9f9" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 20 }}>
        {title ? <Text style={styles.product}>{title}</Text> : null}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} testID={`star-${n}`}>
              <Text style={[styles.star, n <= rating && { color: COLORS.accent }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>
        <View style={styles.card}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            placeholder="شنو رأيك بالمنتج؟ (اختياري)"
            placeholderTextColor="#b5b5b9"
            style={styles.textarea}
            testID="review-comment"
          />
          <Text style={styles.counter}>{comment.length}/1000</Text>
        </View>
        <View style={[styles.card, { paddingVertical: 4 }]}>
          <TextInput value={name} onChangeText={setName} placeholder="اسمك" placeholderTextColor="#b5b5b9" style={styles.nameInput} testID="review-name" />
        </View>
        <Text style={styles.note}>يظهر اسمك الأول فقط مع التقييم.</Text>
        {error ? <Text style={{ color: COLORS.danger, textAlign: "center" }}>{error}</Text> : null}
        <Button label="إرسال التقييم" onPress={submit} loading={busy} testID="submit-review" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  done: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32, backgroundColor: COLORS.bg },
  product: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  stars: { flexDirection: "row", justifyContent: "center", gap: 10 },
  star: { fontSize: 40, color: "#c9cde0" },
  ratingLabel: { textAlign: "center", color: COLORS.muted, minHeight: 20 },
  card: { backgroundColor: "#fff", borderRadius: RADIUS.card, padding: 16, ...SHADOW },
  textarea: {
    minHeight: 140,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlignVertical: "top",
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  counter: { fontSize: 11, color: COLORS.muted, textAlign: Platform.OS === "web" ? "left" : "right" },
  nameInput: { fontSize: 15, fontFamily: FONTS.medium, paddingVertical: 10, color: COLORS.text, textAlign: Platform.OS === "web" ? "right" : "left" },
  note: { fontSize: 12, color: COLORS.muted, textAlign: "center" },
})
