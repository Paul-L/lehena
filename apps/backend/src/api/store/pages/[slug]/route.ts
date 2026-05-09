import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAGES_MODULE } from "../../../../modules/pages"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params
  const pagesService = req.scope.resolve(PAGES_MODULE)

  const previewSecret = process.env.PREVIEW_SECRET
  const previewHeader = req.headers["x-preview-token"]
  const isPreview =
    !!previewSecret &&
    typeof previewHeader === "string" &&
    previewHeader.length > 0 &&
    previewHeader === previewSecret

  const filters: Record<string, unknown> = { slug }
  if (!isPreview) {
    filters.status = "published"
  }

  const [page] = await pagesService.listPages(filters, { take: 1 })

  if (!page) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Page not found")
  }

  return res.json({ page })
}
