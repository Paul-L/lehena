import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import { GDPR_MODULE } from "../../../../../../modules/gdpr"
import { WISHLIST_MODULE } from "../../../../../../modules/wishlist"

/**
 * Returns a JSON blob with every piece of PII we hold about the requesting
 * customer. We deliberately omit Stripe data — that lives in their tenant
 * and is the merchant's responsibility there, not ours. Frequency is
 * loosely rate-limited to 1/day via the `gdpr_log` audit (we don't fail
 * subsequent requests but we record them all).
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer authentication required."
    )
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customer_id, {
    relations: ["addresses"],
  })

  const wishlistService = req.scope.resolve(WISHLIST_MODULE)
  const wishlist = await wishlistService.listWishlistItems({ customer_id })

  const gdprService = req.scope.resolve(GDPR_MODULE)
  const history = await gdprService.listGdprLogs(
    { customer_id },
    { order: { created_at: "DESC" }, take: 50 }
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "shipping_subtotal",
      "created_at",
      "items.*",
      "shipping_address.*",
      "billing_address.*",
    ],
    filters: { customer_id },
  })

  await gdprService.createGdprLogs({
    customer_id,
    action: "export_completed",
    ip:
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ?? null,
  })

  return res.json({
    exported_at: new Date().toISOString(),
    customer: {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      company_name: customer.company_name,
      created_at: customer.created_at,
      metadata: customer.metadata,
    },
    addresses: customer.addresses ?? [],
    orders: orders ?? [],
    wishlist,
    gdpr_history: history,
    notice:
      "Les données de paiement (cartes) sont conservées par notre prestataire Stripe et soumises à leur politique. Contactez contact@lehena.com pour toute question.",
  })
}
