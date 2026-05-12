import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

import { type VerifyMagicLinkSchema } from "../validators"

interface MagicLinkPayload {
  entity_id: string
  actor_type: string
  customer_id: string
  scope: "magic_link"
  iat?: number
  exp?: number
}

/**
 * Verifies a magic-link JWT and returns a regular Medusa customer session
 * token, signed with JWT_SECRET — the same shape produced by
 * `sdk.auth.login`. The storefront then stores it as the auth cookie.
 *
 * Tokens are stateless: we only check signature, expiration, scope, and
 * actor_type. We do NOT store one-time-use markers; the 15-minute expiry is
 * the only protection against replay. This matches NIST 800-63B AAL1 for
 * email-based magic links.
 */
export async function POST(
  req: MedusaRequest<VerifyMagicLinkSchema>,
  res: MedusaResponse
) {
  const { token } = req.validatedBody
  const linkSecret = process.env.MAGIC_LINK_SECRET ?? process.env.JWT_SECRET
  if (!linkSecret) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error("[magic-link/verify] secret missing")
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Magic link verification is not available."
    )
  }

  let payload: MagicLinkPayload
  try {
    payload = jwt.verify(token, linkSecret) as MagicLinkPayload
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Magic link expired or invalid."
    )
  }
  if (payload.scope !== "magic_link" || payload.actor_type !== "customer") {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Magic link expired or invalid."
    )
  }

  // Look up the customer + its auth_identity so we can build a session token
  // that matches what `sdk.auth.login` would produce on a normal login.
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(payload.customer_id)
  if (!customer || customer.email !== payload.entity_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Magic link expired or invalid."
    )
  }

  const authService = req.scope.resolve(Modules.AUTH)
  // Find the auth_identity bound to this customer's emailpass provider.
  const identities = await authService.listAuthIdentities(
    {
      provider_identities: { entity_id: customer.email, provider: "emailpass" },
    },
    { take: 1 }
  )
  if (identities.length === 0) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Magic link expired or invalid."
    )
  }
  const authIdentity = identities[0]

  // Issue the same JWT shape as core-flows/auth/authenticate.ts uses.
  const sessionToken = generateJwtToken(
    {
      actor_id: customer.id,
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
      app_metadata: { customer_id: customer.id },
    },
    {
      secret: process.env.JWT_SECRET!,
      expiresIn: "30d",
    }
  )

  return res.json({ token: sessionToken })
}
