import {
  type MedusaRequest,
  type MedusaResponse,
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
function isValidPreviewToken(token: string, previewSecret: string): boolean {
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

  const locale = (req as MedusaRequest & { locale?: string }).locale
  if (locale) {
    filters.locale = locale
  }

  const [page] = await pagesService.listPages(filters, { take: 1 })

  if (!page) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Page not found")
  }

  // Sibling translations — used by the storefront to emit hreflang.
  let translations: { id: string; locale: string; slug: string }[] = []
  if (page.translation_group_id) {
    const siblings = await pagesService.listPages(
      {
        translation_group_id: page.translation_group_id,
        status: "published",
      },
      { take: 20 }
    )
    translations = siblings.map((s) => ({
      id: s.id,
      locale: s.locale,
      slug: s.slug,
    }))
  }

  return res.json({ page, translations })
}
