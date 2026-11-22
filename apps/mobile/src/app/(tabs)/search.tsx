import { Link, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import Icon, { CategoryIcon } from "../../components/Icon"
import Text from "../../components/Text"
import { Category, listCategories } from "../../lib/api"
import { COLORS, FONTS, RADIUS } from "../../lib/config"

/** Search + browse by category. */
export default function SearchScreen() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [cats, setCats] = useState<Category[]>([])

  useEffect(() => {
    listCategories().then(setCats).catch(() => setCats([]))
  }, [])

  const submit = () => {
    if (q.trim()) router.push({ pathname: "/category/[id]", params: { id: "all", q: q.trim() } })
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={COLORS.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={submit}
          returnKeyType="search"
          placeholder="ابحثي عن منتج..."
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          testID="search-input"
        />
      </View>

      <Text style={styles.title}>تصفّحي الأقسام</Text>
      {cats.map((c) => (
        <Link key={c.id} href={`/category/${c.id}`} asChild>
          <Pressable style={styles.row}>
            <View style={styles.iconCircle}>
              <CategoryIcon name={c.name} size={22} />
            </View>
            <Text style={styles.rowText}>{c.name}</Text>
            <Icon name="chevron-left" size={18} color={COLORS.muted} />
          </Pressable>
        </Link>
      ))}
      <Link href="/category/all" asChild>
        <Pressable style={styles.row}>
          <View style={styles.iconCircle}>
            <Icon name="grid" size={20} />
          </View>
          <Text style={styles.rowText}>كل المنتجات</Text>
          <Icon name="chevron-left" size={18} color={COLORS.muted} />
        </Pressable>
      </Link>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.soft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    height: 46,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    writingDirection: "rtl",
    textAlign: Platform.OS === "web" ? "right" : "left",
  },
  title: { fontSize: 18, fontWeight: "700", marginTop: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: "500" },
})
