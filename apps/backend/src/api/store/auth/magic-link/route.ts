import crypto from "node:crypto"

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
 * Requests a magic-link login token for the given email.
 *
 * Two flows, one endpoint :
 *   - **Login existant** : body = `{ email }`. Si le customer existe on émet
 *     l'event et l'email de login part. Sinon on renvoie 200 en temps
 *     constant (anti-énumération) — aucune trace côté client.
 *   - **Signup passwordless** : body = `{ email, first_name, last_name? }`.
 *     Si aucun customer avec cet email n'existe, on crée l'auth identity
 *     `emailpass` (password random jamais exposé) + l'entité customer,
 *     puis on tombe dans le même flow d'émission event → email.
 *     Si un customer existait déjà, on ignore les infos de nom et on part
 *     sur le login classique (le user ne recrée pas son compte par erreur).
 *
 * L'anti-énumération est préservée : un pur login attempt (`{email}` seul)
 * sur un email inconnu renvoie 200 sans rien faire. Le signup exige au
 * minimum un `first_name`, donc un attaquant ne peut pas énumerer les
 * emails via ce endpoint.
 */
export async function POST(
  req: MedusaRequest<RequestMagicLinkSchema>,
  res: MedusaResponse
) {
  const { email, first_name, last_name } = req.validatedBody
  const secret = process.env.MAGIC_LINK_SECRET ?? process.env.JWT_SECRET
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  if (!secret) {
    // Misconfiguration — fail open with success so we don't leak details to
    // the public client. Logged for ops.
    logger.error(
      "[magic-link] MAGIC_LINK_SECRET / JWT_SECRET missing — skipping issuance"
    )
    return res.json({ success: true })
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const emailLower = email.toLowerCase()

  let customer = (
    await customerService.listCustomers({ email: emailLower }, { take: 1 })
  )[0]

  // Signup passwordless : create auth identity + customer if no match AND
  // the caller provided at least a first_name (signup intent). Login-only
  // attempts on unknown emails still exit silently below.
  if (!customer && first_name) {
    try {
      const authService = req.scope.resolve(Modules.AUTH)
      // Random password : le user ne le verra jamais, la connexion se fait
      // exclusivement via magic-link. Il pourra définir un vrai password
      // depuis son espace client par la suite s'il le souhaite.
      const password = crypto.randomBytes(32).toString("base64url")
      await authService.register("emailpass", {
        body: { email: emailLower, password },
      } as Parameters<typeof authService.register>[1])

      const created = await customerService.createCustomers({
        email: emailLower,
        first_name,
        last_name: last_name ?? undefined,
        has_account: true,
      })
      customer = Array.isArray(created) ? created[0] : created
      logger.info(
        `[magic-link] signup created customer ${customer.id} (email=${emailLower})`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`[magic-link] signup failed for ${emailLower}: ${message}`)
      // On garde le 200 constant-time même en cas d'échec pour ne pas
      // divulguer d'infos exploitables.
      return res.json({ success: true })
    }
  }

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
