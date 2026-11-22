import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { useLayout } from "../../lib/layout"
import BlockRenderer from "../../sdui/Renderer"

/**
 * Home is fully server-driven: its sections come from the layout published in
 * the admin "App builder". Search lives in its own tab.
 */
export default function Home() {
  const router = useRouter()
  const { blocks, error, refresh, preview } = useLayout("home")
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, gap: 26, paddingBottom: 40 }}
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
  )
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: COLORS.muted },
  previewBadge: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 6 },
})
