import { Image } from "expo-image"
import { Link, useRouter } from "expo-router"
import { FlatList, Pressable, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { useCart } from "../../lib/cart"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"

export default function CartScreen() {
  const { cart, updateItem, removeItem, loading } = useCart()
  const router = useRouter()
  const items = cart?.items ?? []

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 48 }}>🛍️</Text>
        <Text style={styles.emptyText}>سلتك فارغة</Text>
        <Link href="/" asChild>
          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>تصفّح المنتجات</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.thumb}>
              {item.thumbnail ? (
                <Image source={item.thumbnail} style={{ width: "100%", height: "100%" }} />
              ) : (
                <Text style={{ fontSize: 28 }}>💄</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontWeight: "600" }}>{item.title}</Text>
              {item.variant_title && item.variant_title !== "قياسي" ? (
                <Text style={{ color: COLORS.muted, fontSize: 13 }}>{item.variant_title}</Text>
              ) : null}
              <Text style={{ color: COLORS.primary, fontWeight: "700" }}>{formatIqd(item.total)}</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  disabled={loading}
                  onPress={() => updateItem(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
                <Text style={{ minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  disabled={loading}
                  onPress={() =>
                    item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)
                  }
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Pressable onPress={() => removeItem(item.id)} disabled={loading}>
                  <Text style={{ color: COLORS.danger, fontSize: 13 }}>حذف</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={{ color: COLORS.muted }}>المجموع (بدون التوصيل)</Text>
          <Text style={{ fontWeight: "700", fontSize: 17 }}>{formatIqd(cart?.item_subtotal ?? cart?.subtotal)}</Text>
        </View>
        <Pressable style={styles.primary} onPress={() => router.push("/checkout")} testID="go-checkout">
          <Text style={styles.primaryText}>إتمام الطلب</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyText: { fontSize: 18, color: COLORS.muted },
  row: { flexDirection: "row", gap: 12 },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, textAlign: "center" },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: "#fff" },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  primary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    alignSelf: "stretch",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
