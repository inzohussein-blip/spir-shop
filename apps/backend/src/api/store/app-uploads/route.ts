import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import type { AppUploadBody } from "../../app-content-validators"
import { tenantFromStoreRequest } from "../../../lib/tenant"

/**
 * POST /store/app-uploads - photos from the app (review photos).
 * Only accepted together with the id of an existing order, so the endpoint
 * can't be used as free anonymous file hosting.
 */
export const POST = async (req: MedusaRequest<AppUploadBody>, res: MedusaResponse) => {
  const { order_id, files } = req.validatedBody
  const tenant = await tenantFromStoreRequest(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters: { id: order_id, sales_channel_id: tenant.sales_channel_id },
  })
  if (!data.length) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "الطلب غير موجود")

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: files.map((f) => ({
        filename: `review-${Date.now()}-${f.filename.replace(/[^\w.-]/g, "_")}`,
        mimeType: f.mime_type,
        content: f.content,
        access: "public" as const,
      })),
    },
  })
  res.json({ urls: result.map((f) => f.url) })
}
