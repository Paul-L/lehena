import { model } from "@medusajs/framework/utils"

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "active",
  "paused",
  "cancelled",
  "past_due",
] as const

/**
 * Customer subscription instance. Mirrors a Stripe Subscription with the
 * Lehena-side metadata we need for the customer portal (shipping address
 * snapshot, gift message, next charge timestamp).
 *
 * Status transitions are driven exclusively by Stripe webhooks:
 *   incomplete → active (first invoice.paid)
 *   active → paused (workflow `pause-subscription`)
 *   paused → active (workflow `resume-subscription`)
 *   active → past_due (invoice.payment_failed after retries)
 *   past_due → active (recovered) | cancelled (final fail)
 *   active → cancelled (workflow `cancel-subscription` end-of-period)
 */
const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  plan_id: model.text(),
  status: model
    .enum(["incomplete", "active", "paused", "cancelled", "past_due"])
    .default("incomplete"),
  /** Stripe Subscription id (`sub_…`). */
  stripe_subscription_id: model.text().unique(),
  /** Stripe Customer id (`cus_…`). Same value as customer.metadata if any. */
  stripe_customer_id: model.text(),
  /** Period bounds tracked from Stripe events. */
  current_period_start: model.dateTime().nullable(),
  current_period_end: model.dateTime().nullable(),
  /** Next scheduled charge (UTC). Null when paused or cancelled. */
  next_charge_at: model.dateTime().nullable(),
  /** Shipping address snapshot — denormalised so the cron knows where to ship. */
  shipping_address: model.json().nullable(),
  /** Optional gift card message printed on the first shipment of each cycle. */
  gift_message: model.text().nullable(),
  /** Operator notes (refund reason, pause reason, etc.). */
  notes: model.text().nullable(),
})

export default Subscription
