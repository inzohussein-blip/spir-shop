import { Link } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import Text from "../../components/Text"
import { Brand, listBrands } from "../../lib/api"
import { COLORS, RADIUS, SHADOW } from "../../lib/config"
import { BlockProps, str } from "../types"

/** Brand name as a typographic "logo" (no third-party logo files are used). */
export function BrandMark({ title, size = 15 }: { title: string; size?: number }) {
  return (
    <Text style={[styles.mark, { fontSize: size }]} numberOfLines={1}>
      {title}
    </Text>
  )
}

/** Horizontal row of brand cards; tapping opens the brand page. */
export function BrandStrip({ props }: BlockProps) {
  const [brands, setBrands] = useState<Brand[]>([])
  useEffect(() => {
    listBrands().then(setBrands).catch(() => setBrands([]))
  }, [])
  if (!brands.length) return null
  return (
    <View style={{ gap: 12 }}>
      {str(props.title) ? (
        <View style={styles.titleRow}>
          <Text style={styles.title}>{str(props.title)}</Text>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, padding: 4 }}>
        {brands.map((b) => (
          <Link key={b.id} href={`/brand/${b.id}`} asChild>
            <Pressable style={styles.card} testID={`brand-${b.handle}`}>
              <BrandMark title={b.title} />
              {b.metadata?.origin ? <Text style={styles.origin}>{b.metadata.origin}</Text> : null}
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  titleRow: { paddingHorizontal: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  card: {
    width: 128,
    height: 76,
    borderRadius: RADIUS.image,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 2,
    ...SHADOW,
  },
  mark: { fontWeight: "700", letterSpacing: 0.5, color: COLORS.text, textAlign: "center" },
  origin: { fontSize: 10, color: COLORS.muted, textAlign: "center" },
})
