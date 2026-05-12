import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { SUBSCRIPTION_MODULE } from "../../../modules/subscription"
import { getStripeClient } from "../../../modules/subscription/stripe-client"

export type SubscriptionMutationKind = "pause" | "resume" | "cancel"

export interface MutateSubscriptionStepInput {
  subscription_id: string
  customer_id: string
  kind: SubscriptionMutationKind
}

/**
 * Single step covering pause / resume / cancel. Validates ownership
 * (customer_id matches), proxies the change to Stripe, then updates the
 * mirror row. Cancel is end-of-period (Stripe's `cancel_at_period_end`)
 * so the customer keeps service until the end of the current cycle.
 */
export const mutateSubscriptionStep = createStep(
  "mutate-subscription",
  async (input: MutateSubscriptionStepInput, { container }) => {
    const service = container.resolve(SUBSCRIPTION_MODULE)
    const sub = await service.retrieveSubscription(input.subscription_id)
    if (!sub || sub.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Subscription not found."
      )
    }

    const stripe = await getStripeClient()
    if (!stripe) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Stripe not configured on this environment."
      )
    }

    let newStatus: "active" | "paused" | "cancelled"
    switch (input.kind) {
      case "pause":
        if (sub.status !== "active") {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "Seuls les abonnements actifs peuvent être mis en pause."
          )
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          pause_collection: { behavior: "void" },
        })
        newStatus = "paused"
        break
      case "resume":
        if (sub.status !== "paused") {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "Seuls les abonnements en pause peuvent être réactivés."
          )
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          pause_collection: "",
        })
        newStatus = "active"
        break
      case "cancel":
        if (sub.status === "cancelled") {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "Cet abonnement est déjà annulé."
          )
        }
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
        // We KEEP the row at status=active here — Stripe will fire
        // `customer.subscription.deleted` when the period actually ends.
        // The webhook handler is what flips us to "cancelled".
        newStatus = sub.status as "active" | "paused" | "cancelled"
        break
    }

    const updated = await service.updateSubscriptions({
      id: sub.id,
      status: newStatus,
    })
    return new StepResponse(updated)
  }
)
