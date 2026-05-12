import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

import { type RequestMagicLinkSchema } from "./validators"

const TOKEN_TTL = "15m"
const EVENT_NAME = "auth.magic_link_requested"

/**
 * Requests a magic-link login token for the given email. We don't reveal
 * whether the email is on file (constant-time response) to avoid account
 * enumeration. When a matching customer exists, we mint a short-lived JWT
 * carrying `entity_id` + `actor_type` + `scope: "magic_link"` and emit
 * `auth.magic_link_requested` so the subscriber can log or email it.
 */
export async function POST(
  req: MedusaRequest<RequestMagicLinkSchema>,
  res: MedusaResponse
) {
  const { email } = req.validatedBody
  const secret = process.env.MAGIC_LINK_SECRET ?? process.env.JWT_SECRET
  if (!secret) {
    // Misconfiguration — fail open with success so we don't leak details to
    // the public client. Logged for ops.
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(
      "[magic-link] MAGIC_LINK_SECRET / JWT_SECRET missing — skipping issuance"
    )
    return res.json({ success: true })
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const existing = await customerService.listCustomers(
    { email: email.toLowerCase() },
    { take: 1 }
  )
  const customer = existing[0]

  if (customer) {
    const token = jwt.sign(
      {
        entity_id: customer.email,
        actor_type: "customer",
        customer_id: customer.id,
        scope: "magic_link",
      },
      secret,
      { expiresIn: TOKEN_TTL }
    )

    const eventBus = req.scope.resolve(Modules.EVENT_BUS)
    await eventBus.emit({
      name: EVENT_NAME,
      data: { email: customer.email, customer_id: customer.id, token },
    })
  }

  // Constant-time success.
  return res.json({ success: true })
}
