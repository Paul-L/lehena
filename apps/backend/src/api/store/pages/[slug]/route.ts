import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import { PAGES_MODULE } from "../../../../modules/pages"

/**
 * Returns true if the supplied token grants preview access.
 *
 * Two token formats are accepted, both signed/keyed with PREVIEW_SECRET:
 *   1. A JWT with `scope: "preview"` minted by /admin/pages/preview-token
 *      (the path used by the admin UI; expires after 1h).
 *   2. The raw PREVIEW_SECRET string itself (kept for curl/debugging and
 *      backwards compatibility with the integration tests).
 */
function isValidPreviewToken(
  token: string,
  previewSecret: string
): boolean {
  if (token === previewSecret) return true
  try {
    const payload = jwt.verify(token, previewSecret) as
      | { scope?: string }
      | string
    return typeof payload === "object" && payload?.scope === "preview"
  } catch {
    return false
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params
  const pagesService = req.scope.resolve(PAGES_MODULE)

  const previewSecret = process.env.PREVIEW_SECRET
  const headerToken = req.headers["x-preview-token"]
  const queryToken =
    typeof req.query.preview === "string" ? req.query.preview : null
  const candidate =
    typeof headerToken === "string" && headerToken.length > 0
      ? headerToken
      : queryToken

  const isPreview =
    !!previewSecret &&
    !!candidate &&
    isValidPreviewToken(candidate, previewSecret)

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
