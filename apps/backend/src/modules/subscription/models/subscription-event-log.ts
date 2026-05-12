import { model } from "@medusajs/framework/utils"

/**
 * Idempotency log for Stripe subscription webhooks. Every event handled
 * gets a row; a duplicate event id is detected on insert (partial unique
 * index) and skipped before any side effect runs.
 *
 * Kept as a thin append-only table — no joins, just a dedup gate.
 */
const SubscriptionEventLog = model.define("subscription_event_log", {
  id: model.id().primaryKey(),
  /** Stripe event id (`evt_...`). */
  stripe_event_id: model.text().unique(),
  /** Stripe event type (e.g. `invoice.paid`). */
  event_type: model.text(),
  /** Affected subscription id, when known. */
  subscription_id: model.text().nullable(),
  outcome: model.enum(["processed", "skipped", "failed"]).default("processed"),
  notes: model.text().nullable(),
})

export default SubscriptionEventLog
