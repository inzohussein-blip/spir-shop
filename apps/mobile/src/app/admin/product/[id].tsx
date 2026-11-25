import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native"
import Button from "../../../components/Button"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, ErrorBox, Field, Loading, PhotoGrid, pickImages } from "../../../components/admin/ui"
import { adminFetch, AdminProduct, PickedImage, uploadImages } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { confirmAsk } from "../../../lib/confirm"

type Photo = { uri: string; upload?: PickedImage }
type Category = { id: string; name: string }

const digits = (v: string) => v.replace(/[^\d٠-٩]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
const withCommas = (v: string) => (v ? Number(v).toLocaleString("en-US") : "")

/** Add a product (/admin/product/new) or edit one: photos, name, price, description, categories, visible. */
export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === "new"
  const router = useRouter()
  const [loaded, setLoaded] = useState(isNew)
  const [product, setProduct] = useState<AdminProduct | null>(null)
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [visible, setVisible] = useState(true)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState<"save" | "delete" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetch<{ product_categories: Category[] }>("/admin/product-categories?fields=id,name&limit=100")
      .then((r) => setCategories(r.product_categories))
      .catch(() => undefined)
    if (isNew) return
    adminFetch<{ product: AdminProduct }>(`/admin/app-products/${id}`)
      .then(({ product: p }) => {
        setProduct(p)
        setTitle(p.title)
        setPrice(p.price != null ? String(Math.round(p.price)) : "")
        setDescription(p.description ?? "")
        setVisible(p.status === "published")
        setPhotos(p.images.map((uri) => ({ uri })))
        setSelected((p.categories ?? []).map((c) => c.id))
        setLoaded(true)
      })
      .catch((e) => setError((e as Error).message))
  }, [id, isNew])

  const addPhotos = async (camera: boolean) => {
    const picked = await pickImages({ camera, max: 6 - photos.length })
    setPhotos([...photos, ...picked.map((p) => ({ uri: p.uri, upload: p }))].slice(0, 6))
  }

  const save = async () => {
    if (!title.trim()) return setError("اكتب اسم المنتج")
    if (!price && (isNew || product?.simple)) return setError("اكتب السعر")
    setBusy("save")
    setError(null)
    try {
      // upload new photos first, keeping the order shown on screen
      const fresh = photos.filter((p) => p.upload)
      const urls = await uploadImages(fresh.map((p) => p.upload!))
      let k = 0
      const images = photos.map((p) => (p.upload ? urls[k++] : p.uri))
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        status: visible ? "published" : "draft",
        images,
        category_ids: selected,
        ...(isNew || product?.simple ? { price: Number(price) } : {}),
      }
      if (isNew) await adminFetch("/admin/app-products", { method: "POST", body })
      else await adminFetch(`/admin/app-products/${id}`, { method: "POST", body })
      router.back()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!(await confirmAsk("حذف هذا المنتج نهائياً؟", "حذف"))) return
    setBusy("delete")
    try {
      await adminFetch(`/admin/app-products/${id}`, { method: "DELETE" })
      router.back()
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  if (!loaded) {
    return (
      <View style={adminStyles.page}>
        <AdminHeader title="المنتج" back />
        {error ? (
          <View style={{ padding: 16 }}>
            <ErrorBox message={error} />
          </View>
        ) : (
          <Loading />
        )}
      </View>
    )
  }

  const priceEditable = isNew || !!product?.simple
  return (
    <KeyboardAvoidingView style={adminStyles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <AdminHeader title={isNew ? "منتج جديد" : "تعديل المنتج"} back />
      <ScrollView contentContainerStyle={adminStyles.content} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <Text style={adminStyles.title}>الصور</Text>
          <Text style={adminStyles.muted}>أول صورة تظهر بالقائمة. لحد 6 صور.</Text>
          <PhotoGrid photos={photos.map((p) => p.uri)} onRemove={(i) => setPhotos(photos.filter((_, j) => j !== i))} onAdd={addPhotos} />
        </Card>

        <Card style={{ gap: 14 }}>
          <Field label="اسم المنتج" value={title} onChangeText={setTitle} placeholder="مثلاً: سيروم فيتامين سي 30 مل" testID="product-title" />
          {priceEditable ? (
            <Field
              label="السعر (دينار عراقي)"
              value={withCommas(price)}
              onChangeText={(v) => setPrice(digits(v))}
              keyboardType="number-pad"
              placeholder="25,000"
              testID="product-price"
            />
          ) : (
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: "700" }}>السعر</Text>
              <Text style={adminStyles.muted}>هذا المنتج بعدة أحجام أو درجات، أسعاره تتعدل من لوحة التحكم.</Text>
              {product?.variants.map((v) => (
                <Text key={v.id} style={adminStyles.muted}>
                  {v.title}: {v.price != null ? Number(v.price).toLocaleString("en-US") : "—"} د.ع
                </Text>
              ))}
            </View>
          )}
          <Field label="الوصف" value={description} onChangeText={setDescription} multiline placeholder="طريقة الاستخدام، المكونات، الحجم..." />
        </Card>

        {categories.length ? (
          <Card style={{ gap: 10 }}>
            <Text style={adminStyles.title}>القسم</Text>
            <View style={styles.chips}>
              {categories.map((c) => {
                const on = selected.includes(c.id)
                return (
                  <Pressable key={c.id} onPress={() => setSelected(on ? selected.filter((x) => x !== c.id) : [...selected, c.id])} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[{ fontSize: 13 }, on && { color: COLORS.onPrimary, fontWeight: "700" }]}>{c.name}</Text>
                  </Pressable>
                )
              })}
            </View>
          </Card>
        ) : null}

        <Card style={adminStyles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>ظاهر بالمتجر</Text>
            <Text style={adminStyles.muted}>{visible ? "الزبائن يشوفون المنتج ويطلبونه" : "مخفي عن الزبائن"}</Text>
          </View>
          <Switch value={visible} onValueChange={setVisible} trackColor={{ true: COLORS.accent, false: "#d0d0d4" }} />
        </Card>

        {error ? <ErrorBox message={error} /> : null}
        <Button label={isNew ? "إضافة المنتج" : "حفظ التعديلات"} onPress={save} loading={busy === "save"} disabled={!!busy} testID="product-save" />
        {!isNew ? <Button label="حذف المنتج" variant="outline" onPress={remove} loading={busy === "delete"} disabled={!!busy} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", backgroundColor: "#fff" },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
})
