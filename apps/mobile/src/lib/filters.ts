import AsyncStorage from "@react-native-async-storage/async-storage"
import { lowestPrice } from "../components/ProductCard"
import type { Product, Rating } from "./api"
import { saleInfo } from "./store"

/** Filters from the design's filter panel. */
export type Filters = {
  /** price range in IQD; null = no limit */
  min: number | null
  max: number | null
  /** shade colours (hex) from metadata.swatches */
  shades: string[]
  /** minimum star rating, 0 = any */
  rating: number
  categoryId: string | null
  /** minimum discount percentages selected (any of them) */
  discounts: number[]
}

export const EMPTY_FILTERS: Filters = { min: null, max: null, shades: [], rating: 0, categoryId: null, discounts: [] }

export const DISCOUNT_OPTIONS = [25, 20, 15, 10]

export const priceOf = (p: Product) => saleInfo(p)?.price ?? lowestPrice(p) ?? 0

export const productShades = (p: Product) => Object.values(p.metadata?.swatches ?? {}).map((c) => c.toLowerCase())

export function countActive(f: Filters) {
  return (
    (f.min != null || f.max != null ? 1 : 0) +
    (f.shades.length ? 1 : 0) +
    (f.rating ? 1 : 0) +
    (f.categoryId ? 1 : 0) +
    (f.discounts.length ? 1 : 0)
  )
}

export function applyFilters(products: Product[], f: Filters, ratings: Record<string, Rating>) {
  return products.filter((p) => {
    const price = priceOf(p)
    if (f.min != null && price < f.min) return false
    if (f.max != null && price > f.max) return false
    if (f.shades.length && !productShades(p).some((c) => f.shades.includes(c))) return false
    if (f.rating && (ratings[p.id]?.average ?? 0) < f.rating) return false
    if (f.categoryId && !p.categories?.some((c) => c.id === f.categoryId)) return false
    if (f.discounts.length) {
      const pct = saleInfo(p)?.percent ?? 0
      if (!pct || pct < Math.min(...f.discounts)) return false
    }
    return true
  })
}

/* ------------------------------ recent searches ----------------------------- */

const RECENT_KEY = "spir_recent_searches"

export async function getRecentSearches(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(RECENT_KEY)) ?? "[]")
  } catch {
    return []
  }
}

export async function saveRecentSearches(list: string[]) {
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))).catch(() => undefined)
}

export async function addRecentSearch(q: string) {
  const list = await getRecentSearches()
  await saveRecentSearches([q, ...list.filter((x) => x !== q)])
}
