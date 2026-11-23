import { useRouter } from "expo-router"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import HandRefresh from "../../components/HandRefresh"
import Header from "../../components/Header"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { useLayout } from "../../lib/layout"
import BlockRenderer from "../../sdui/Renderer"

/**
 * Home (design: "homepage"): ☰ · store name · bell, then the sections published
 * from the admin "App builder" (category circles, banner, product sliders, collections).
 */
export default function Home() {
  const router = useRouter()
  const { blocks, error, refresh, preview } = useLayout("home")

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Header variant="menu" title="Spir Shop" />
      {/* pull down: a hand grabs the page like a sheet and pulls it back up (refresh) */}
      <HandRefresh onRefresh={refresh} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 40 }}>
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
      </HandRefresh>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: COLORS.muted },
  previewBadge: { backgroundColor: COLORS.accent, borderRadius: 8, padding: 6, marginBottom: 12 },
})
