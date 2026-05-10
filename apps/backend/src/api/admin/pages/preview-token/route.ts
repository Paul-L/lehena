import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

const TOKEN_TTL_SECONDS = 60 * 60 // 1 hour

/**
 * Issues a short-lived preview JWT signed with PREVIEW_SECRET.
 *
 * The storefront forwards this token to `GET /store/pages/:slug` via the
 * `x-preview-token` header (or `?preview=…` query param) so editors can
 * see drafts. The token expires after one hour and carries `scope:"preview"`
 * so it cannot be confused with other JWTs in the system.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "PREVIEW_SECRET is not configured on the server."
    )
  }

  const token = jwt.sign(
    { scope: "preview" },
    previewSecret,
    { expiresIn: TOKEN_TTL_SECONDS }
  )

  return res.json({
    token,
    expires_in: TOKEN_TTL_SECONDS,
  })
}
