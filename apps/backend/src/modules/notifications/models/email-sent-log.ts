import { model } from "@medusajs/framework/utils"

/**
 * Append-only record of every email we've successfully handed off to Resend
 * (or stubbed in dev). Used to make subscribers idempotent: if a duplicate
 * `order.placed` event comes in, the subscriber checks `email_sent_log` for
 * a matching `(template, dedupe_key)` and skips the send.
 */
const EmailSentLog = model.define("email_sent_log", {
  id: model.id().primaryKey(),
  template: model.text(),
  /** e.g. `order:ord_01...`, `cart:cart_01...`, `customer:cus_01...` */
  dedupe_key: model.text(),
  recipient: model.text(),
  /** Resend message id; null when running in stub mode without API key. */
  resend_id: model.text().nullable(),
  /** Soft status: "sent", "failed", "skipped". */
  status: model.enum(["sent", "failed", "skipped"]).default("sent"),
  notes: model.text().nullable(),
})

export default EmailSentLog
