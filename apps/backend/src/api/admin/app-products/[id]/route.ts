import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { loadOwnProduct, serializeProduct } from "../../../../lib/admin-products"
import { updateSimpleProductWorkflow } from "../../../../workflows/app-admin/products"
import type { UpdateAppProductBody } from "../../../app-content-validators"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.json({ product: serializeProduct(await loadOwnProduct(req, req.params.id)) })
}

/** POST /admin/app-products/:id - edit title, description, photos, categories, status and (single-variant) price. */
export const POST = async (req: AuthenticatedMedusaRequest<UpdateAppProductBody>, res: MedusaResponse) => {
  const product = serializeProduct(await loadOwnProduct(req, req.params.id))
  if (req.validatedBody.price !== undefined && !product.simple) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "هذا المنتج بعدة أحجام أو درجات: عدّل أسعاره من لوحة التحكم")
  }
  await updateSimpleProductWorkflow(req.scope).run({ input: { id: product.id, ...req.validatedBody } })
  res.json({ product: serializeProduct(await loadOwnProduct(req, product.id)) })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const product = await loadOwnProduct(req, req.params.id)
  await deleteProductsWorkflow(req.scope).run({ input: { ids: [product.id] } })
  res.json({ id: product.id, object: "product", deleted: true })
}
