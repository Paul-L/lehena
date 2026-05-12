import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { verifyPreferencesToken } from "../../../../lib/preferences-token"
import { type UnsubscribeSchema } from "../validators"

/**
 * One-click unsubscribe from marketing emails. The token is a long-lived
 * (180 days) signed JWT carrying the recipient's email. We flip
 * `customer.metadata.newsletter_marketing = false` without requiring login.
 *
 * Returns 200 even if the email isn't on file — we don't leak account
 * existence via this endpoint.
 */
export async function POST(
  req: MedusaRequest<UnsubscribeSchema>,
  res: MedusaResponse
) {
  const { token } = req.validatedBody
  const email = verifyPreferencesToken(token)
  if (!email) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Lien invalide ou expiré."
    )
  }
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const matches = await customerService.listCustomers(
    { email: email.toLowerCase() },
    { take: 1 }
  )
  if (matches.length > 0) {
    const c = matches[0]
    const md = (c.metadata as Record<string, unknown> | null) ?? {}
    await customerService.updateCustomers(c.id, {
      metadata: { ...md, newsletter_marketing: false },
    })
  }
  return res.json({ success: true })
}
