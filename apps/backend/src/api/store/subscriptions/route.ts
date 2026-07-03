import {
  type AuthenticatedMedusaRequest,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../../../modules/subscription"

/**
 * Lists active subscription plans (public) when no auth context, or the
 * authenticated customer's own subscriptions otherwise.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authReq = req as AuthenticatedMedusaRequest
  const subService =
    req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
  const customer_id = authReq.auth_context?.actor_id
  if (customer_id) {
    const subs = await subService.listSubscriptions(
      { customer_id },
      { order: { created_at: "DESC" }, take: 50 }
    )
    return res.json({ subscriptions: subs })
  }
  const plans = await subService.listSubscriptionPlans(
    { active: true },
    { order: { price_cents: "ASC" } }
  )
  return res.json({ plans })
}
