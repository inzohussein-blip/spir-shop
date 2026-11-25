import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ADMIN_PRODUCT_FIELDS, loadOwnProduct, serializeProduct } from "../../../lib/admin-products"
import { tenantFromAdminRequest } from "../../../lib/tenant"
import { createSimpleProductWorkflow } from "../../../workflows/app-admin/products"
import type { AppProductBody } from "../../app-content-validators"

/** GET /admin/app-products?q=&offset= - the selected store's products, newest first. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const tenant = await tenantFromAdminRequest(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "products_link.product_id"],
    filters: { id: tenant.sales_channel_id },
  })
  const ids = ((channels[0]?.products_link ?? []) as { product_id: string }[]).map((l) => l.product_id)
  if (!ids.length) {
    res.json({ products: [], count: 0 })
    return
  }
  const q = String(req.query.q ?? "").trim()
  const offset = Math.max(0, Number(req.query.offset ?? 0) || 0)
  const { data, metadata } = await query.graph({
    entity: "product",
    fields: ADMIN_PRODUCT_FIELDS,
    filters: { id: ids, ...(q ? { title: { $ilike: `%${q}%` } } : {}) },
    pagination: { take: 30, skip: offset, order: { created_at: "DESC" } },
  })
  res.json({ products: data.map((p) => serializeProduct(p as never)), count: metadata?.count ?? data.length })
}

/** POST /admin/app-products - add a product (one price) to the selected store. */
export const POST = async (req: AuthenticatedMedusaRequest<AppProductBody>, res: MedusaResponse) => {
  const tenant = await tenantFromAdminRequest(req)
  const { result } = await createSimpleProductWorkflow(req.scope).run({
    input: { ...req.validatedBody, sales_channel_id: tenant.sales_channel_id },
  })
  res.json({ product: serializeProduct(await loadOwnProduct(req, result[0].id)) })
}
