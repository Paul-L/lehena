import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

import {
  GDPR_MODULE,
  type GdprModuleService,
} from "../../../../../../modules/gdpr"
import { type DeleteRequestSchema } from "../validators"

/**
 * Step 1 of the account-deletion flow. The customer re-confirms their
 * password (proof of presence), we mint a 1-hour single-purpose JWT,
 * persist a gdpr_log row, and emit `gdpr.delete_requested` so the
 * subscriber can email/log the confirmation link. The actual anonymisation
 * happens on /gdpr/delete-confirm when the customer clicks the link.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<DeleteRequestSchema>,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication required."
    )
  }
  const { password, notes } = req.validatedBody

  // Verify password by re-running emailpass authentication.
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customer_id)
  if (!customer.email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer has no email on file."
    )
  }

  const authService = req.scope.resolve(Modules.AUTH)
  const auth = await authService.authenticate("emailpass", {
    body: { email: customer.email, password },
  } as Parameters<typeof authService.authenticate>[1])
  if (!auth.success) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Mot de passe incorrect."
    )
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Server misconfiguration: JWT_SECRET missing."
    )
  }
  const token = jwt.sign({ customer_id, scope: "gdpr_delete" }, secret, {
    expiresIn: "1h",
  })

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ?? null

  const gdprService = req.scope.resolve<GdprModuleService>(GDPR_MODULE)
  await gdprService.createGdprLogs({
    customer_id,
    action: "delete_requested",
    ip,
    notes: notes ?? null,
  })

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "gdpr.delete_requested",
    data: { customer_id, email: customer.email, token },
  })

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`[gdpr] delete requested for ${customer.email} (${customer_id})`)

  return res.json({ success: true })
}
