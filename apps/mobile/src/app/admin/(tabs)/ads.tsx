import { Image } from "expo-image"
import { useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import Button from "../../../components/Button"
import Icon from "../../../components/Icon"
import Text from "../../../components/Text"
import { AdminHeader, adminStyles, Card, ErrorBox, Field, Segments, pickImages } from "../../../components/admin/ui"
import { adminFetch, PickedImage, uploadImages } from "../../../lib/admin"
import { COLORS } from "../../../lib/config"
import { confirmAsk } from "../../../lib/confirm"

type Block = { id: string; type: string; props: Record<string, unknown> }
type Slide = { title?: string; subtitle?: string; image_url?: string; link?: string; background_color?: string; text_color?: string }
type Layout = { draft: { blocks: Block[] }; published: { blocks: Block[] } | null }
type Story = { id: string; title: string; media_url: string; media_type: string; link?: string | null; is_active: boolean }
type Category = { id: string; name: string }

/** Where a banner or story opens in the customer app. */
function LinkPicker({ value, onChange, categories }: { value: string; onChange: (v: string) => void; categories: Category[] }) {
  const options = [
    { value: "/category/all", label: "كل المنتجات" },
    { value: "/category/all?sale=1", label: "العروض" },
    ...categories.map((c) => ({ value: `/category/${c.id}`, label: c.name })),
  ]
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700" }}>عند الضغط يفتح</Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, value === o.value && styles.chipOn]}>
            <Text style={[{ fontSize: 13 }, value === o.value && { color: COLORS.onPrimary, fontWeight: "700" }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

/** Image + title + link form shared by banners and stories. */
function NewAdForm({ kind, categories, onSave }: { kind: "banner" | "story"; categories: Category[]; onSave: (v: { image: PickedImage; title: string; link: string }) => Promise<void> }) {
  const [image, setImage] = useState<(PickedImage & { uri: string }) | null>(null)
  const [title, setTitle] = useState("")
  const [link, setLink] = useState("/category/all")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (camera: boolean) => {
    const [p] = await pickImages({ camera })
    if (p) setImage(p)
  }
  const save = async () => {
    if (!image) return setError("اختر صورة")
    if (kind === "story" && !title.trim()) return setError("اكتب عنوان القصة")
    setBusy(true)
    setError(null)
    try {
      await onSave({ image, title: title.trim(), link })
      setImage(null)
      setTitle("")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ gap: 12 }}>
      <Text style={adminStyles.title}>{kind === "banner" ? "إعلان جديد بالصفحة الرئيسية" : "قصة جديدة"}</Text>
      <Text style={adminStyles.muted}>{kind === "banner" ? "صورة عريضة (مثلاً 1200×600) تظهر بأعلى الصفحة الرئيسية." : "صورة طولية (مثلاً 1080×1920) تظهر بشريط القصص."}</Text>
      {image ? (
        <Pressable onPress={() => setImage(null)}>
          <Image source={image.uri} style={kind === "banner" ? styles.bannerPreview : styles.storyPreview} contentFit="cover" />
          <Text style={[adminStyles.muted, { marginTop: 4 }]}>اضغط على الصورة لإزالتها</Text>
        </Pressable>
      ) : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button label="المعرض" icon="image" variant="outline" onPress={() => pick(false)} style={{ flex: 1 }} />
          <Button label="الكاميرا" icon="camera" variant="outline" onPress={() => pick(true)} style={{ flex: 1 }} />
        </View>
      )}
      <Field label={kind === "banner" ? "النص على الإعلان (اختياري)" : "عنوان القصة"} value={title} onChangeText={setTitle} placeholder={kind === "banner" ? "خصم 20% على العناية بالبشرة" : "وصل حديثاً"} />
      <LinkPicker value={link} onChange={setLink} categories={categories} />
      {error ? <ErrorBox message={error} /> : null}
      <Button label="نشر" onPress={save} loading={busy} />
    </Card>
  )
}

export default function Ads() {
  const [tab, setTab] = useState<"banner" | "story">("banner")
  const [layout, setLayout] = useState<Layout | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [l, s, c] = await Promise.all([
        adminFetch<{ layout: Layout }>("/admin/app-layouts/home"),
        adminFetch<{ stories: Story[] }>("/admin/app-stories"),
        adminFetch<{ product_categories: Category[] }>("/admin/product-categories?fields=id,name&limit=100").catch(() => ({ product_categories: [] })),
      ])
      setLayout(l.layout)
      setStories(s.stories)
      setCategories(c.product_categories)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  // The live home page; banners are the slides of its first carousel
  const blocks = layout?.published?.blocks ?? layout?.draft.blocks ?? []
  const heroIndex = blocks.findIndex((b) => b.type === "hero_carousel")
  const slides = ((heroIndex >= 0 ? blocks[heroIndex].props.slides : []) as Slide[]) ?? []

  const publishSlides = async (next: Slide[]) => {
    const copy = blocks.map((b) => ({ ...b, props: { ...b.props } }))
    if (heroIndex >= 0) copy[heroIndex].props.slides = next
    else copy.splice(Math.min(1, copy.length), 0, { id: `hero-${Date.now()}`, type: "hero_carousel", props: { slides: next, interval: 5 } })
    const r = await adminFetch<{ layout: Layout }>("/admin/app-layouts/home/publish", { method: "POST", body: { blocks: copy } })
    setLayout(r.layout)
  }

  const addBanner = async ({ image, title, link }: { image: PickedImage; title: string; link: string }) => {
    const [url] = await uploadImages([image])
    await publishSlides([{ title, subtitle: "", image_url: url, link, background_color: "#c9b8a8", text_color: "#ffffff" }, ...slides.filter((s) => s.image_url || s.title)])
  }

  const removeBanner = async (i: number) => {
    if (!(await confirmAsk("حذف هذا الإعلان من الصفحة الرئيسية؟", "حذف"))) return
    try {
      await publishSlides(slides.filter((_, j) => j !== i))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const addStory = async ({ image, title, link }: { image: PickedImage; title: string; link: string }) => {
    const [url] = await uploadImages([image])
    await adminFetch("/admin/app-stories", { method: "POST", body: { title, media_url: url, media_type: "image", link, cta_label: "تسوّقي الآن" } })
    await load()
  }

  const removeStory = async (id: string) => {
    if (!(await confirmAsk("حذف هذه القصة؟", "حذف"))) return
    try {
      await adminFetch(`/admin/app-stories/${id}`, { method: "DELETE" })
      setStories(stories.filter((s) => s.id !== id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <View style={adminStyles.page}>
      <AdminHeader title="الإعلانات" />
      <View style={{ paddingVertical: 12 }}>
        <Segments value={tab} onChange={setTab} options={[{ value: "banner", label: "إعلانات الرئيسية", count: slides.length }, { value: "story", label: "القصص", count: stories.length }]} />
      </View>
      <ScrollView
        contentContainerStyle={[adminStyles.content, { paddingTop: 0 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
      >
        {error ? <ErrorBox message={error} onRetry={load} /> : null}
        {tab === "banner" ? (
          <>
            <NewAdForm kind="banner" categories={categories} onSave={addBanner} />
            {slides.map((s, i) => (
              <Card key={`${s.image_url}-${i}`} style={{ gap: 8 }}>
                {s.image_url ? <Image source={s.image_url} style={styles.bannerPreview} contentFit="cover" /> : <View style={[styles.bannerPreview, { backgroundColor: s.background_color ?? COLORS.soft }]} />}
                <View style={adminStyles.rowBetween}>
                  <Text style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>
                    {s.title || "بدون نص"}
                  </Text>
                  <Pressable onPress={() => removeBanner(i)} hitSlop={8} accessibilityLabel="حذف الإعلان">
                    <Icon name="trash-2" size={20} color={COLORS.danger} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </>
        ) : (
          <>
            <NewAdForm kind="story" categories={categories} onSave={addStory} />
            <View style={styles.stories}>
              {stories.map((s) => (
                <View key={s.id} style={styles.story}>
                  <Image source={s.media_url} style={styles.storyThumb} contentFit="cover" />
                  <Text style={{ fontSize: 12 }} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Pressable onPress={() => removeStory(s.id)} style={styles.storyRemove} hitSlop={6} accessibilityLabel="حذف القصة">
                    <Icon name="x" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", backgroundColor: "#fff" },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bannerPreview: { width: "100%", aspectRatio: 2, borderRadius: 12, backgroundColor: COLORS.soft },
  storyPreview: { width: 140, aspectRatio: 9 / 16, borderRadius: 12, backgroundColor: COLORS.soft },
  stories: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  story: { width: 100, gap: 4 },
  storyThumb: { width: 100, height: 160, borderRadius: 12, backgroundColor: COLORS.soft },
  storyRemove: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
})
