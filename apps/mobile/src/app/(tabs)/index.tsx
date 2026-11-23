import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { getNotifications } from "../../lib/api"
import { COLORS } from "../../lib/config"
import { useLayout } from "../../lib/layout"
import { useStore } from "../../lib/store"
import BlockRenderer from "../../sdui/Renderer"

/**
 * Home: delivery address, notifications and search on top; every section
 * below comes from the layout published in the admin "App builder".
 */
export default function Home() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { address, notificationsSeenAt } = useStore()
  const { blocks, error, refresh, preview } = useLayout("home")
  const [refreshing, setRefreshing] = useState(false)
  const [unread, setUnread] = useState(false)

  useEffect(() => {
    getNotifications(address?.province)
      .then((list) => setUnread(list.some((n) => new Date(n.sent_at).getTime() > notificationsSeenAt)))
      .catch(() => undefined)
  }, [address?.province, notificationsSeenAt])

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/address")} style={{ flex: 1 }} testID="header-address">
          <Text style={styles.deliverTo}>التوصيل إلى</Text>
          <View style={styles.addressRow}>
            <Icon name="map-pin" size={16} />
            <Text style={styles.address} numberOfLines={1}>
              {address ? `${address.province}، ${address.city}` : "اختاري عنوان التوصيل"}
            </Text>
            <Icon name="chevron-down" size={16} />
          </View>
        </Pressable>
        <Pressable style={styles.bell} onPress={() => router.push("/notifications")} accessibilityLabel="الإشعارات" testID="open-notifications">
          <Icon name="bell" size={20} />
          {unread ? <View style={styles.unread} /> : null}
        </Pressable>
      </View>
      <Pressable style={styles.search} onPress={() => router.push("/search")} testID="home-search">
        <Icon name="search" size={18} color={COLORS.muted} />
        <Text style={styles.searchText}>ابحثي عن منتج أو علامة تجارية...</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, gap: 24, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {preview ? (
          <View style={styles.previewBadge}>
            <Text style={{ color: "#fff", fontSize: 12, textAlign: "center" }}>معاينة المسودة</Text>
          </View>
        ) : null}
        {blocks ? (
          <BlockRenderer blocks={blocks} />
        ) : error ? (
          <View style={{ gap: 16, marginTop: 40 }}>
            <Text style={styles.empty}>تعذّر الاتصال بالمتجر. اسحب للأسفل لإعادة المحاولة.</Text>
            <Button label="إعدادات الخادم" variant="outline" onPress={() => router.push("/server")} testID="open-server" />
          </View>
        ) : (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 8, gap: 12 },
  deliverTo: { fontSize: 12, color: COLORS.muted },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { fontSize: 16, fontWeight: "700", flexShrink: 1 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  unread: {
    position: "absolute",
    top: 9,
    end: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.soft,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    backgroundColor: COLORS.soft,
  },
  searchText: { color: COLORS.muted, fontSize: 14 },
  empty: { textAlign: "center", color: COLORS.muted },
  previewBadge: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 6 },
})
