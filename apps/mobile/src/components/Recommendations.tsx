import { useEffect, useState } from "react"
import { View } from "react-native"
import { listProducts, Product } from "../lib/api"
import { COLORS } from "../lib/config"
import ProductCard from "./ProductCard"
import Text from "./Text"

/** "You may also like": a two-column grid of products, skipping the given ones. */
export default function Recommendations({ exclude = [], title = "قد يعجبك أيضاً", limit = 6 }: { exclude?: string[]; title?: string; limit?: number }) {
  const [items, setItems] = useState<Product[]>([])
  const key = exclude.join(",")
  useEffect(() => {
    listProducts({ limit: limit + exclude.length, order: "-created_at" })
      .then((list) => setItems(list.filter((p) => !exclude.includes(p.id)).slice(0, limit)))
      .catch(() => undefined)
  }, [key, limit]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!items.length) return null
  return (
    <View style={{ gap: 10 }} testID="recommendations">
      <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
        {items.map((p) => (
          <View key={p.id} style={{ width: "50%" }}>
            <ProductCard product={p} />
          </View>
        ))}
      </View>
    </View>
  )
}
