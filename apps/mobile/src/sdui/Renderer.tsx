import { Component, ComponentType, ReactNode } from "react"
import { View } from "react-native"
import type { Block, Features } from "../lib/api"
import { useStore } from "../lib/store"
import { CountdownOffer, Heading, HeroBanner, Spacer } from "./blocks/simple"
import { CategoryChips, ProductCarousel, ProductGrid } from "./blocks/products"
import { StoryBar, VideoBanner } from "./blocks/media"
import { BrandStrip } from "./blocks/brands"
import { FlashSale, HeroCarousel, TrustStrip } from "./blocks/commerce"
import { CollectionBanner, CollectionPair } from "./blocks/collections"
import { ProductFeed } from "./blocks/feed"
import type { BlockProps } from "./types"

/**
 * Block registry. To add a new block type: build the component, register it
 * here, and add it to the admin builder config. Older app versions that don't
 * know a type simply skip it.
 */
const REGISTRY: Record<string, ComponentType<BlockProps>> = {
  hero_banner: HeroBanner,
  hero_carousel: HeroCarousel,
  trust_strip: TrustStrip,
  flash_sale: FlashSale,
  story_bar: StoryBar,
  category_chips: CategoryChips,
  brand_strip: BrandStrip,
  product_carousel: ProductCarousel,
  product_grid: ProductGrid,
  product_feed: ProductFeed,
  countdown_offer: CountdownOffer,
  video_banner: VideoBanner,
  collection_banner: CollectionBanner,
  collection_pair: CollectionPair,
  heading: Heading,
  spacer: Spacer,
}

/** One broken block (bad props from the server) must not take down the whole screen. */
class BlockBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Blocks hidden when the store switched the matching feature off. */
const FEATURE_OF: Record<string, keyof Features> = { story_bar: "stories", brand_strip: "brands", flash_sale: "flash_sale" }

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  const { features } = useStore()
  blocks = blocks.filter((b) => !FEATURE_OF[b.type] || features[FEATURE_OF[b.type]])
  return (
    <View style={{ gap: 22 }}>
      {blocks.map((block) => {
        const Comp = REGISTRY[block.type]
        if (!Comp) return null
        return (
          <BlockBoundary key={block.id}>
            <Comp block={block} props={block.props ?? {}} />
          </BlockBoundary>
        )
      })}
    </View>
  )
}
