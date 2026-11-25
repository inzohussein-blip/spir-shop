import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { STORE_CURRENCY } from "../workflows/app-admin/products"
import { adminAccess } from "./tenant"

export const ADMIN_PRODUCT_FIELDS = [
  "id",
  "title",
  "description",
  "status",
  "thumbnail",
  "created_at",
  "images.url",
  "categories.id",
  "categories.name",
  "variants.id",
  "variants.title",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "sales_channels.id",
]

type ProductRecord = {
  id: string
  variants?: ({ id: string; title?: string; prices?: ({ amount: number; currency_code: string } | null)[] | null } | null)[] | null
  images?: ({ url: string } | null)[] | null
  sales_channels?: ({ id: string } | null)[] | null
  [key: string]: unknown
}

/** Shape used by the manager app: the store-currency price of each variant, photo URLs. */
export function serializeProduct(p: ProductRecord) {
  const { variants, images, sales_channels: _channels, ...rest } = p
  const list = (variants ?? []).filter(Boolean).map((v) => ({
    id: v!.id,
    title: v!.title ?? "",
    price: (v!.prices ?? []).find((x) => x?.currency_code === STORE_CURRENCY)?.amount ?? null,
  }))
  return {
    ...rest,
    images: (images ?? []).filter(Boolean).map((i) => i!.url),
    variants: list,
    price: list[0]?.price ?? null,
    simple: list.length <= 1,
  }
}

/** One product, only if it's listed in a store the admin user manages. */
export async function loadOwnProduct(req: MedusaRequest, id: string): Promise<ProductRecord> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product", fields: ADMIN_PRODUCT_FIELDS, filters: { id } })
  const product = data[0] as unknown as ProductRecord | undefined
  const access = await adminAccess(req)
  const channels = new Set(access.tenants.map((t) => t.sales_channel_id))
  if (!product || (!access.platform && !(product.sales_channels ?? []).some((c) => c && channels.has(c.id)))) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "المنتج غير موجود")
  }
  return product
}
