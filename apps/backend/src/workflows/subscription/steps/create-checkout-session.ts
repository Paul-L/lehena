import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../../../modules/subscription"
import { getStripeClient } from "../../../modules/subscription/stripe-client"

export interface CreateCheckoutSessionStepInput {
  customer_id: string
  plan_id: string
  /** Pre-filled shipping address — stored on the resulting Subscription. */
  shipping_address?: Record<string, unknown> | null
  gift_message?: string | null
  /** Storefront URL the customer returns to after Stripe Checkout. */
  return_url: string
}

/**
 * Builds a Stripe Checkout Session in `mode=subscription`. The session
 * carries the plan's `stripe_price_env_key`-resolved price; on success
 * Stripe fires `customer.subscription.created` + `invoice.paid` webhooks
 * which complete the persistence on our side.
 *
 * The DB row is created upfront with status="incomplete" so the user can
 * see "Abonnement en attente de paiement" in /account/subscriptions
 * before Stripe confirms.
 */
export const createCheckoutSessionStep = createStep(
  "create-subscription-checkout-session",
  async (input: CreateCheckoutSessionStepInput, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const subService =
      container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
    const customerService = container.resolve(Modules.CUSTOMER)

    const plan = await subService.retrieveSubscriptionPlan(input.plan_id)
    if (!plan?.active) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Plan unavailable.")
    }
    const stripePriceId = process.env[plan.stripe_price_env_key]
    if (!stripePriceId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Stripe Price not configured for plan ${plan.slug} (env ${plan.stripe_price_env_key}).`
      )
    }

    const customer = await customerService.retrieveCustomer(input.customer_id)
    if (!customer?.email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer missing email."
      )
    }

    const stripe = await getStripeClient()
    if (!stripe) {
      // Stub path — dev / CI without API key. We pretend we issued a
      // checkout URL and return null so the storefront can surface a
      // helpful message rather than crashing.
      logger.warn(
        "[subscription] STRIPE_API_KEY missing — no checkout session minted"
      )
      return new StepResponse({
        checkout_url: null as string | null,
        stripe_session_id: null as string | null,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: customer.email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${input.return_url}?subscription=success`,
      cancel_url: `${input.return_url}?subscription=cancelled`,
      metadata: {
        lehena_customer_id: input.customer_id,
        lehena_plan_id: plan.id,
        gift_message: input.gift_message ?? "",
      },
      subscription_data: {
        metadata: {
          lehena_customer_id: input.customer_id,
          lehena_plan_id: plan.id,
        },
      },
    })

    return new StepResponse({
      checkout_url: session.url as string | null,
      stripe_session_id: session.id as string | null,
    })
  }
)
