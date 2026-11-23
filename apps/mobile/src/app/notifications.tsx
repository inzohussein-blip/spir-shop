import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native"
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

  if (!items) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />

  return (
    <FlatList
      style={{ backgroundColor: "#f9f9f9" }}
      data={items}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 20, gap: 14 }}
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
            <Text style={styles.date}>{new Date(item.sent_at).toLocaleDateString("ar-IQ")}</Text>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: RADIUS.card - 6, padding: 16, gap: 6, ...SHADOW },
  title: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 13, color: COLORS.muted, lineHeight: 20 },
  date: { fontSize: 11, color: "#c4c4c4" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
})
