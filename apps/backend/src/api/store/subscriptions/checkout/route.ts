import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../../../../modules/subscription"
import { createSubscriptionCheckoutWorkflow } from "../../../../workflows/subscription"
import { type StartCheckoutSchema } from "../validators"

/**
 * Initiates a Stripe Checkout Session for a subscription. The customer
 * must be authenticated — we resolve the plan from its slug to keep the
 * client-side payload narrow.
 *
 * Returns `{ checkout_url, stripe_session_id }`. When Stripe isn't
 * configured (dev) we return `checkout_url: null` so the storefront can
 * surface a "abonnements indisponibles" copy.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<StartCheckoutSchema>,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Connectez-vous pour souscrire à un abonnement."
    )
  }
  const { plan_slug, gift_message } = req.validatedBody

  const subService =
    req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
  const [plan] = await subService.listSubscriptionPlans(
    { slug: plan_slug, active: true },
    { take: 1 }
  )
  if (!plan) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Plan "${plan_slug}" introuvable.`
    )
  }

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const { result } = await createSubscriptionCheckoutWorkflow(req.scope).run({
    input: {
      customer_id,
      plan_id: plan.id,
      gift_message: gift_message ?? null,
      return_url: `${storefrontUrl}/fr/account/subscriptions`,
    },
  })

  return res.json(result)
}
