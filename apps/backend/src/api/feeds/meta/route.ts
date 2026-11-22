import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
} from "@medusajs/framework/utils"

/**
 * Meta (Facebook / Instagram) product catalog feed — RSS 2.0 XML.
 * Public URL: GET /feeds/meta  (add it as a "Scheduled feed" in Meta Commerce Manager)
 *
 * Each variant becomes one catalog item, grouped by product (item_group_id).
 */
const xml = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const currency = (process.env.META_FEED_CURRENCY || "iqd").toLowerCase()
  const storefront = (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")
  const countryPath = process.env.STOREFRONT_COUNTRY_CODE || "iq"
  const brand = process.env.STORE_BRAND_NAME || "Spir Shop"

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: { is_disabled: false },
    pagination: { take: 1 },
  })

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "images.url",
      "categories.name",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
    filters: { status: "published" },
  })

  const variantIds = products.flatMap((p) => (p.variants ?? []).map((v) => v!.id))
  const availability =
    channels[0] && variantIds.length
      ? await getVariantAvailability(query, {
          variant_ids: variantIds,
          sales_channel_id: channels[0].id,
        })
      : {}

  const items: string[] = []
  for (const p of products) {
    const images = (p.images ?? []).map((i) => i!.url).filter(Boolean)
    const mainImage = p.thumbnail || images[0] || ""
    const extra = images.filter((u) => u !== mainImage).slice(0, 10)
    const multi = (p.variants ?? []).length > 1

    for (const v of p.variants ?? []) {
      if (!v) continue
      const price = (v.prices ?? []).find((pr) => pr?.currency_code === currency)
      if (!price) continue
      const qty = availability[v.id]?.availability ?? 0

      items.push(
        [
          "<item>",
          `<g:id>${xml(v.sku || v.id)}</g:id>`,
          `<g:item_group_id>${xml(p.id)}</g:item_group_id>`,
          `<g:title>${xml(multi ? `${p.title} - ${v.title}` : p.title)}</g:title>`,
          `<g:description>${xml(p.description || p.title)}</g:description>`,
          `<g:link>${xml(`${storefront}/${countryPath}/products/${p.handle}`)}</g:link>`,
          `<g:image_link>${xml(mainImage)}</g:image_link>`,
          ...extra.map((u) => `<g:additional_image_link>${xml(u)}</g:additional_image_link>`),
          `<g:availability>${qty > 0 ? "in stock" : "out of stock"}</g:availability>`,
          `<g:condition>new</g:condition>`,
          `<g:price>${Math.round(Number(price.amount))} ${currency.toUpperCase()}</g:price>`,
          `<g:brand>${xml(brand)}</g:brand>`,
          p.categories?.[0]?.name
            ? `<g:product_type>${xml(p.categories[0].name)}</g:product_type>`
            : "",
          "</item>",
        ].join("")
      )
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${xml(brand)}</title>
<link>${xml(storefront)}</link>
<description>${xml(brand)} product catalog</description>
${items.join("\n")}
</channel>
</rss>`

  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=900")
  res.status(200).send(body)
}
