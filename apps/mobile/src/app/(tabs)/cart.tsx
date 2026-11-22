import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { FlatList, Pressable, StyleSheet, View } from "react-native"
import Button from "../../components/Button"
import Icon from "../../components/Icon"
import Text from "../../components/Text"
import { useCart } from "../../lib/cart"
import { COLORS, RADIUS, SHADOW } from "../../lib/config"
import { formatIqd } from "../../lib/format"

export default function CartScreen() {
  const { cart, updateItem, removeItem, loading } = useCart()
  const router = useRouter()
  const items = cart?.items ?? []
  const subtotal = cart?.item_subtotal ?? cart?.subtotal ?? 0

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Icon name="shopping-bag" size={40} />
        </View>
        <Text style={styles.emptyTitle}>سلتك فارغة</Text>
        <Text style={styles.emptyText}>أضيفي منتجاتك المفضلة وستظهر هنا</Text>
        <Button label="تصفّحي المنتجات" onPress={() => router.push("/")} style={{ alignSelf: "stretch", marginTop: 12 }} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 24, gap: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card} testID="cart-item">
            <View style={styles.thumb}>
              {item.thumbnail ? (
                <Image source={item.thumbnail} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : null}
            </View>
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.title}
                </Text>
                <Pressable onPress={() => removeItem(item.id)} disabled={loading} hitSlop={10} accessibilityLabel="حذف">
                  <Icon name="x" size={18} color={COLORS.muted} />
                </Pressable>
              </View>
              <Text style={styles.price}>{formatIqd(item.total)}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.variant} numberOfLines={1}>
                  {item.variant_title && item.variant_title !== "قياسي" ? item.variant_title : ""}
                </Text>
                <View style={styles.qty}>
                  <Pressable
                    disabled={loading}
                    onPress={() => updateItem(item.id, item.quantity + 1)}
                    hitSlop={8}
                    accessibilityLabel="زيادة"
                  >
                    <Icon name="plus" size={14} color="rgba(0,0,0,0.5)" />
                  </Pressable>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <Pressable
                    disabled={loading}
                    onPress={() => (item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id))}
                    hitSlop={8}
                    accessibilityLabel="إنقاص"
                  >
                    <Icon name="minus" size={14} color="rgba(0,0,0,0.5)" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>سعر المنتجات</Text>
          <Text style={styles.sumValue}>{formatIqd(subtotal)}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>التوصيل</Text>
          <Text style={styles.sumValue}>يُحدد حسب المحافظة</Text>
        </View>
        <View style={[styles.sumRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
          <Text style={{ fontSize: 14, fontWeight: "500" }}>المجموع</Text>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>{formatIqd(subtotal)}</Text>
        </View>
        <Button label="إتمام الطلب" onPress={() => router.push("/checkout")} testID="go-checkout" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32, backgroundColor: COLORS.bg },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { color: COLORS.muted },
  card: {
    flexDirection: "row",
    height: 110,
    backgroundColor: "#fff",
    borderRadius: RADIUS.card,
    borderWidth: 0.5,
    borderColor: "#fbfbfb",
    ...SHADOW,
  },
  thumb: {
    width: 98,
    height: "100%",
    backgroundColor: COLORS.soft,
    borderTopStartRadius: RADIUS.card,
    borderBottomStartRadius: RADIUS.card,
    overflow: "hidden",
  },
  info: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 13, fontWeight: "700" },
  price: { fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  variant: { fontSize: 11, color: COLORS.muted, flex: 1 },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.5)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    height: 26,
  },
  qtyText: { fontSize: 12, fontWeight: "700", color: "rgba(0,0,0,0.6)", minWidth: 10, textAlign: "center" },
  summary: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -1 },
    elevation: 8,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sumLabel: { fontSize: 14, color: COLORS.muted },
  sumValue: { fontSize: 14 },
})
