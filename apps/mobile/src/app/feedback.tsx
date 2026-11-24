import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Button from "../components/Button"
import Header from "../components/Header"
import Text from "../components/Text"
import ThanksModal from "../components/ThanksModal"
import { sendFeedback } from "../lib/api"
import { COLORS, FONTS, IS_NATURAL, SHADOW } from "../lib/config"
import { useStore } from "../lib/store"

/** Rate this app (design: "share your feedback"). Sent to the staff Telegram chat. */
export default function FeedbackScreen() {
  const router = useRouter()
  const { address } = useStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!rating) return setError("اختاري عدد النجوم")
    setBusy(true)
    setError(null)
    try {
      await sendFeedback({ rating, comment: comment.trim() || undefined, name: address?.firstName, phone: address?.phone })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.pageAlt }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title="شاركينا رأيك" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 16, paddingBottom: 40, gap: 26 }}>
        <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "500" }}>شنو رأيج بتطبيق Spir Shop؟</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} testID={`app-star-${n}`}>
              <Text style={[styles.star, n <= rating && { color: IS_NATURAL ? COLORS.accent : COLORS.primaryDark }]}>★</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.card}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            placeholder="شنو نقدر نحسّن؟"
            placeholderTextColor="#8a8a8f"
            style={styles.textarea}
          />
        </View>
        {error ? <Text style={{ color: COLORS.danger, textAlign: "center" }}>{error}</Text> : null}
        <Button label="إرسال" onPress={submit} loading={busy} testID="send-feedback" />
      </ScrollView>
      <ThanksModal
        visible={done}
        title="شكراً على رأيك!"
        body={"نقدّر وقتك، وراح نستخدم رأيك\nحتى نحسّن تجربتك."}
        onDone={() => (router.canGoBack() ? router.back() : router.replace("/account"))}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  stars: { flexDirection: "row", justifyContent: "center", gap: 12 },
  star: { fontSize: 44, color: "#b7bac9", lineHeight: 52 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, ...SHADOW, shadowOpacity: 0.06 },
  textarea: {
    minHeight: 170,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlignVertical: "top",
    textAlign: Platform.OS === "web" ? "right" : "left",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
  },
})
