import { Modal, Pressable, StyleSheet, View } from "react-native"
import { COLORS } from "../lib/config"
import Icon from "./Icon"
import Text from "./Text"

/** "Thank you for your feedback!" card over a dimmed screen (design: rate product - 2). */
export default function ThanksModal({ visible, title, body, onDone }: { visible: boolean; title: string; body: string; onDone: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.halo}>
            <View style={styles.check}>
              <Icon name="check" size={30} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.btn} onPress={onDone} testID="thanks-done">
            <Text style={styles.btnText}>تم</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 10, alignItems: "center", paddingHorizontal: 24, paddingTop: 22, paddingBottom: 22, gap: 12 },
  halo: { width: 82, height: 82, borderRadius: 41, backgroundColor: "#eef4f2", alignItems: "center", justifyContent: "center" },
  check: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", marginTop: 6 },
  body: { fontSize: 13, color: "#6b6b8a", textAlign: "center", lineHeight: 21 },
  btn: { backgroundColor: COLORS.dark, borderRadius: 16, height: 32, paddingHorizontal: 40, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
})
