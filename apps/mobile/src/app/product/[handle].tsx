import { Image } from "expo-image"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { getProduct, Product } from "../../lib/api"
import { useCart } from "../../lib/cart"
import { COLORS } from "../../lib/config"
import { formatIqd } from "../../lib/format"

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const router = useRouter()
  const { addItem, loading } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getProduct(handle)
      .then((p) => {
        setProduct(p)
        if (p?.variants.length) setVariantId(p.variants[0].id)
      })
      .catch(() => setError(true))
  }, [handle])

  if (error) return <Text style={styles.center}>تعذّر تحميل المنتج</Text>
  if (!product) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />

  const variant = product.variants.find((v) => v.id === variantId)
  const inStock =
    !variant?.manage_inventory || variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0
  const image = product.thumbnail || product.images?.[0]?.url

  const onAdd = async () => {
    if (!variant) return
    try {
      await addItem(variant.id)
      router.push("/cart")
    } catch (e) {
      Alert.alert("خطأ", (e as Error).message)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: product.title }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={image} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 80 }}>💄</Text>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{formatIqd(variant?.calculated_price?.calculated_amount)}</Text>

          {product.variants.length > 1 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>اختر الحجم</Text>
              <View style={styles.variants}>
                {product.variants.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => setVariantId(v.id)}
                    style={[styles.variant, v.id === variantId && styles.variantActive]}
                  >
                    <Text style={v.id === variantId ? { color: "#fff", fontWeight: "700" } : undefined}>
                      {v.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {!!product.description && <Text style={styles.description}>{product.description}</Text>}

          <View style={styles.perks}>
            <Text>🚚 توصيل بغداد خلال 24 ساعة، والمحافظات 2-3 أيام</Text>
            <Text>💵 الدفع نقداً عند الاستلام</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.addBtn, (!inStock || loading) && { opacity: 0.5 }]}
          disabled={!inStock || loading}
          onPress={onAdd}
          testID="add-to-cart"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addText}>{inStock ? "أضف إلى السلة" : "نفد من المخزون"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: "center", marginTop: 60 },
  imageWrap: { aspectRatio: 1, backgroundColor: COLORS.soft, alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 14 },
  title: { fontSize: 22, fontWeight: "700" },
  price: { fontSize: 20, color: COLORS.primary, fontWeight: "700" },
  label: { fontWeight: "600" },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  variant: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  variantActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  description: { color: COLORS.muted, lineHeight: 24 },
  perks: { backgroundColor: COLORS.soft, borderRadius: 12, padding: 14, gap: 8 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "700", fontSize: 16 },
})
