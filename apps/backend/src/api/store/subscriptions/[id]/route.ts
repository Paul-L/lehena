import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { mutateSubscriptionWorkflow } from "../../../../workflows/subscription"
import { type MutateSubscriptionSchema } from "../validators"

/**
 * Pause / resume / cancel a customer's subscription. The workflow
 * validates ownership; we just forward.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<MutateSubscriptionSchema>,
  res: MedusaResponse
) {
  const customer_id = req.auth_context?.actor_id
  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authentication required."
    )
  }
  const { id } = req.params
  const { kind } = req.validatedBody
  const { result } = await mutateSubscriptionWorkflow(req.scope).run({
    input: { subscription_id: id, customer_id, kind },
  })
  return res.json({ subscription: result })
}
