import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Text from "../../components/Text"
import { COLORS } from "../../lib/config"
import { useLayout } from "../../lib/layout"
import BlockRenderer from "../../sdui/Renderer"

/**
 * Home is fully server-driven: its sections come from the layout published in
 * the admin "App builder". Only the search bar is fixed.
 */
export default function Home() {
  const router = useRouter()
  const { blocks, error, refresh, preview } = useLayout("home")
  const [refreshing, setRefreshing] = useState(false)
  const [q, setQ] = useState("")

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 12, gap: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {preview ? (
        <View style={styles.previewBadge}>
          <Text style={{ color: "#fff", fontSize: 12, textAlign: "center" }}>معاينة المسودة</Text>
        </View>
      ) : null}
      <TextInput
        placeholder="ابحث عن منتج..."
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => q.trim() && router.push({ pathname: "/category/[id]", params: { id: "all", q } })}
        returnKeyType="search"
        style={styles.search}
        placeholderTextColor={COLORS.muted}
      />
      {blocks ? (
        <BlockRenderer blocks={blocks} />
      ) : error ? (
        <Text style={styles.empty}>تعذّر الاتصال بالمتجر. اسحب للأسفل لإعادة المحاولة.</Text>
      ) : (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    writingDirection: "rtl",
    // on native RTL, "left" means start (right side)
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  empty: { textAlign: "center", marginTop: 40, color: COLORS.muted },
  previewBadge: { backgroundColor: COLORS.primaryDark, borderRadius: 8, padding: 6 },
})
