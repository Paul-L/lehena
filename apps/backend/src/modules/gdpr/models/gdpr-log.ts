import { model } from "@medusajs/framework/utils"

/**
 * Append-only audit trail of RGPD actions. We persist this even on the
 * anonymised customer so the legal record survives the data deletion (the
 * customer_id stays pointing at the anonymised stub row).
 */
const GdprLog = model.define("gdpr_log", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  action: model.enum([
    "export_requested",
    "export_completed",
    "delete_requested",
    "delete_completed",
  ]),
  /** IP captured from the request; truncated to /24 for IPv4. */
  ip: model.text().nullable(),
  /** Free-form notes for ops (e.g. delete reason). */
  notes: model.text().nullable(),
})

export default GdprLog
