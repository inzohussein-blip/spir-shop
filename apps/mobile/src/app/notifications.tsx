import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native"
import Header from "../components/Header"
import Icon from "../components/Icon"
import Text from "../components/Text"
import { AppNotification, getNotifications } from "../lib/api"
import { COLORS, RADIUS, SHADOW } from "../lib/config"
import { openLink } from "../lib/links"
import { useStore } from "../lib/store"

/** Offers sent from the admin ("App notifications"), newest first. */
export default function NotificationsScreen() {
  const router = useRouter()
  const { address, notificationsSeenAt, markNotificationsSeen } = useStore()
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const [seenBefore] = useState(notificationsSeenAt)

  useEffect(() => {
    getNotifications(address?.province)
      .then((list) => {
        setItems(list)
        markNotificationsSeen()
      })
      .catch(() => setItems([]))
  }, [address?.province, markNotificationsSeen])

  return (
    <View style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <Header title="الإشعارات" />
      {!items ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
    <FlatList
      style={{ backgroundColor: "#f9f9f9" }}
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ paddingHorizontal: 30, paddingTop: 14, paddingBottom: 30, gap: 30 }}
      ListEmptyComponent={
        <View style={{ alignItems: "center", marginTop: 60, gap: 10 }}>
          <Icon name="bell" size={36} color={COLORS.muted} />
          <Text style={{ color: COLORS.muted }}>لا توجد إشعارات بعد</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isNew = new Date(item.sent_at).getTime() > seenBefore
        return (
          <Pressable style={styles.card} onPress={() => openLink(router, item.link)} disabled={!item.link}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.title}>{item.title}</Text>
              {isNew ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.body}>{item.body}</Text>
          </Pressable>
        )
      }}
    />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 22, paddingVertical: 20, gap: 8, borderWidth: 1, borderColor: "#f0f0f0", ...SHADOW, shadowOpacity: 0.04 },
  title: { fontSize: 15, fontWeight: "500" },
  body: { fontSize: 13, color: "#6b6b6b", lineHeight: 21 },
  date: { fontSize: 11, color: "#c4c4c4" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
})
