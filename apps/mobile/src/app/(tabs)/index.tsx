import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Header from "../../components/Header"
import SearchBar from "../../components/SearchBar"
import Text from "../../components/Text"
import { COLORS, TAB_SPACE } from "../../lib/config"
import { useLayout } from "../../lib/layout"
import { useStore } from "../../lib/store"
import BlockRenderer from "../../sdui/Renderer"
import { nearEndHandler } from "../../lib/feed"

/**
 * Home (design: "homepage"): ☰ · store name · bell, then the sections published
 * from the admin "App builder" (category circles, banner, product sliders, collections).
 */
export default function Home() {
  const router = useRouter()
  const { blocks, error, refresh, preview } = useLayout("home")
  const { tenant } = useStore()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title={tenant?.branding.app_name ?? "Spir Shop"} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40 + TAB_SPACE }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={nearEndHandler}
        scrollEventThrottle={250}
      >
        {/* search first, like a shop app */}
        <View style={{ marginBottom: 14 }}>
          <SearchBar
            placeholder="شنو تدورين عليه؟"
            testID="home-search"
            onPress={() => router.push("/find")}
            onFilter={() => router.push({ pathname: "/category/[id]", params: { id: "all", filter: "1" } })}
          />
        </View>
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
            <Button label="إعادة المحاولة" variant="outline" onPress={refresh} testID="retry" />
          </View>
        ) : (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: COLORS.muted },
  previewBadge: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 6, marginBottom: 12 },
})
