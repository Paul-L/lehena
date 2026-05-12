import { model } from "@medusajs/framework/utils"

/**
 * One row per generated PDF invoice. We persist the numero (sequential per
 * year, legally required in France) and a pointer to the storage URL — the
 * PDF itself lives in S3 (Scaleway in prod, MinIO in dev).
 *
 * `order_id` is the Medusa order id; `number` follows the FR pattern
 * `YYYY-NNNNNN` (e.g. `2026-000123`). Numero generation is centralised in
 * the workflow to keep concurrency safe.
 */
const Invoice = model.define("invoice", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  number: model.text(),
  /** Year extracted from `number` — denormalised for fast count-per-year. */
  year: model.number(),
  /** Total TTC in cents (snapshot at issuance — kept stable for audit). */
  amount: model.number(),
  currency_code: model.text().default("eur"),
  /** Public URL or storage key relative to S3 bucket. */
  storage_url: model.text(),
})

export default Invoice
