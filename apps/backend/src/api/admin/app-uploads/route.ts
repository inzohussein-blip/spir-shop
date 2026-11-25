import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import type { AdminAppUploadBody } from "../../app-content-validators"

/** POST /admin/app-uploads - photos from the manager app (products, ads, stories). Returns their public URLs. */
export const POST = async (req: AuthenticatedMedusaRequest<AdminAppUploadBody>, res: MedusaResponse) => {
  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: req.validatedBody.files.map((f) => ({
        filename: `app-${Date.now()}-${f.filename.replace(/[^\w.-]/g, "_")}`,
        mimeType: f.mime_type,
        content: f.content,
        access: "public" as const,
      })),
    },
  })
  res.json({ urls: result.map((f) => f.url) })
}
