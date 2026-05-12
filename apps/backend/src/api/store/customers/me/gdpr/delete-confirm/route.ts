import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

import { anonymiseCustomerWorkflow } from "../../../../../../workflows/gdpr"
import { type DeleteConfirmSchema } from "../validators"

interface DeletePayload {
  customer_id: string
  scope: "gdpr_delete"
  iat?: number
  exp?: number
}

/**
 * Step 3 of the account-deletion flow. Verifies the single-use JWT issued
 * by `delete-request`, then runs the anonymisation workflow.
 *
 * Note: we do not require the request to be authenticated as the same
 * customer; the token IS the authentication. This lets a customer confirm
 * the deletion from a different device than the one that requested it.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<DeleteConfirmSchema>,
  res: MedusaResponse
) {
  const { token } = req.validatedBody
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Server misconfiguration."
    )
  }
  let payload: DeletePayload
  try {
    payload = jwt.verify(token, secret) as DeletePayload
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Lien expiré ou invalide."
    )
  }
  if (payload.scope !== "gdpr_delete" || !payload.customer_id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Lien invalide.")
  }

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ?? null

  await anonymiseCustomerWorkflow(req.scope).run({
    input: { customer_id: payload.customer_id, ip },
  })

  return res.json({ success: true })
}
