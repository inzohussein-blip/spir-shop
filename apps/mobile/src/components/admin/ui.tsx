import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { ReactNode } from "react"
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { STATUS_COLORS, STATUS_LABELS, OrderStatus, PickedImage } from "../../lib/admin"
import { COLORS, FONTS, SHADOW } from "../../lib/config"
import Icon, { IconName } from "../Icon"
import Text from "../Text"

/** Page title bar of the manager app, with an optional back button and action. */
export function AdminHeader({ title, back, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerSide}>
        {back ? (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/admin"))} hitSlop={10} accessibilityLabel="رجوع">
            <Icon name="chevron-right" size={24} color={COLORS.text} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.headerSide, { alignItems: "flex-end" }]}>{action}</View>
    </View>
  )
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status]
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  )
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={COLORS.muted}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: "top", paddingTop: 12 }, props.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

export function Segments<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && { color: COLORS.onPrimary }]}>
              {o.label}
              {o.count ? ` (${o.count})` : ""}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  )
}

export function Empty({ icon, text, children }: { icon: IconName; text: string; children?: ReactNode }) {
  return (
    <View style={[styles.center, { gap: 12, paddingVertical: 48 }]}>
      <Icon name={icon} size={40} color={COLORS.muted} />
      <Text style={{ color: COLORS.muted, textAlign: "center" }}>{text}</Text>
      {children}
    </View>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={{ color: COLORS.danger, flex: 1 }}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={{ color: COLORS.text, fontWeight: "700" }}>إعادة</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** Round "+" button floating over a list. */
export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const insets = useSafeAreaInsets()
  return (
    <Pressable onPress={onPress} style={[styles.fab, { bottom: insets.bottom + 84 }]} accessibilityLabel={label}>
      <Icon name="plus" size={26} color={COLORS.onPrimary} />
    </Pressable>
  )
}

/** Pick photos from the gallery or the camera (base64, ready to upload). */
export async function pickImages(opts: { camera?: boolean; max?: number } = {}): Promise<(PickedImage & { uri: string })[]> {
  if (opts.camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("الكاميرا", "اسمح للتطبيق باستخدام الكاميرا من إعدادات الهاتف")
      return []
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.7,
    base64: true,
    allowsMultipleSelection: !opts.camera && (opts.max ?? 1) > 1,
    selectionLimit: opts.max ?? 1,
  }
  const r = opts.camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
  if (r.canceled) return []
  return r.assets
    .filter((a) => a.base64)
    .map((a, i) => ({
      uri: a.uri,
      base64: a.base64!,
      mime: a.mimeType && ["image/jpeg", "image/png", "image/webp"].includes(a.mimeType) ? a.mimeType : "image/jpeg",
      name: a.fileName ?? `photo-${Date.now()}-${i}.jpg`,
    }))
}

/** Photo grid: existing (URL) and newly picked photos, with remove buttons and add tiles. */
export function PhotoGrid({
  photos,
  onRemove,
  onAdd,
  max = 6,
}: {
  photos: string[]
  onRemove: (index: number) => void
  onAdd: (camera: boolean) => void
  max?: number
}) {
  return (
    <View style={styles.photos}>
      {photos.map((uri, i) => (
        <View key={`${uri}-${i}`} style={styles.photo}>
          <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" />
          {i === 0 ? (
            <View style={styles.mainTag}>
              <Text style={{ color: "#fff", fontSize: 10 }}>الرئيسية</Text>
            </View>
          ) : null}
          <Pressable style={styles.remove} onPress={() => onRemove(i)} hitSlop={6} accessibilityLabel="حذف الصورة">
            <Icon name="x" size={12} color="#fff" />
          </Pressable>
        </View>
      ))}
      {photos.length < max ? (
        <>
          <Pressable style={[styles.photo, styles.addTile]} onPress={() => onAdd(false)} accessibilityLabel="إضافة صورة من المعرض">
            <Icon name="image" size={24} color={COLORS.muted} />
            <Text style={styles.addText}>المعرض</Text>
          </Pressable>
          <Pressable style={[styles.photo, styles.addTile]} onPress={() => onAdd(true)} accessibilityLabel="تصوير">
            <Icon name="camera" size={24} color={COLORS.muted} />
            <Text style={styles.addText}>الكاميرا</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  )
}

export const adminStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f5f7" },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  muted: { color: COLORS.muted, fontSize: 13 },
  title: { fontSize: 16, fontWeight: "700" },
  search: {
    marginHorizontal: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
})

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerSide: { width: 72 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, ...SHADOW },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  pillText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "700" },
  hint: { fontSize: 12, color: COLORS.muted },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    textAlign: "right",
  },
  segment: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, justifyContent: "center" },
  segmentActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  segmentText: { fontSize: 13, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fdeeee", borderRadius: 12, padding: 12 },
  fab: { position: "absolute", left: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", ...SHADOW, elevation: 6 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photo: { width: 92, height: 92, borderRadius: 12, overflow: "hidden", backgroundColor: COLORS.soft },
  addTile: { alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#c9cde0", backgroundColor: "#fff" },
  addText: { fontSize: 11, color: COLORS.muted },
  remove: { position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  mainTag: { position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
})
