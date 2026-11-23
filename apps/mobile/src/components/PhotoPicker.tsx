import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { Alert, Pressable, StyleSheet, View } from "react-native"
import Icon from "./Icon"

export type PickedPhoto = { uri: string; base64: string; mime: string; name: string }

const MAX = 4

/** Dashed "gallery" and "camera" boxes from the design, plus the picked photos. */
export default function PhotoPicker({ photos, onChange }: { photos: PickedPhoto[]; onChange: (p: PickedPhoto[]) => void }) {
  const pick = async (camera: boolean) => {
    if (photos.length >= MAX) return
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) return Alert.alert("الكاميرا", "اسمحي للتطبيق باستخدام الكاميرا من الإعدادات")
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, base64: true, allowsMultipleSelection: !camera, selectionLimit: MAX - photos.length }
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    if (r.canceled) return
    const added = r.assets
      .filter((a) => a.base64)
      .map((a, i) => ({
        uri: a.uri,
        base64: a.base64!,
        mime: a.mimeType && ["image/jpeg", "image/png", "image/webp"].includes(a.mimeType) ? a.mimeType : "image/jpeg",
        name: a.fileName ?? `photo-${Date.now()}-${i}.jpg`,
      }))
    onChange([...photos, ...added].slice(0, MAX))
  }

  return (
    <View style={styles.row}>
      {photos.map((p) => (
        <View key={p.uri} style={styles.box}>
          <Image source={p.uri} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Pressable style={styles.remove} onPress={() => onChange(photos.filter((x) => x.uri !== p.uri))} hitSlop={6}>
            <Icon name="x" size={12} color="#fff" />
          </Pressable>
        </View>
      ))}
      {photos.length < MAX ? (
        <>
          <Pressable style={[styles.box, styles.dashed]} onPress={() => pick(false)} accessibilityLabel="إضافة صورة" testID="pick-gallery">
            <Icon name="image" size={26} color="#c9cde0" />
          </Pressable>
          <Pressable style={[styles.box, styles.dashed]} onPress={() => pick(true)} accessibilityLabel="تصوير" testID="pick-camera">
            <Icon name="camera" size={26} color="#c9cde0" />
          </Pressable>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  box: { width: 66, height: 64, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dashed: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "#c9cde0" },
  remove: { position: "absolute", top: 4, end: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
})
