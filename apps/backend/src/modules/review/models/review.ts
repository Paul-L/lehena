import { model } from "@medusajs/framework/utils"

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const

/**
 * Customer product review. One row per (customer × product), enforced by a
 * partial unique index in the migration so re-running the workflow on the
 * same purchase doesn't create duplicates.
 *
 * Moderation policy in V1: every new review lands as `pending`. An admin
 * approves or rejects manually from /admin/reviews. We never auto-approve
 * — spam pressure is too high on food / artisanal sites.
 */
const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  /** Nullable so an anonymous import (e.g. legacy WP avis) can still land. */
  customer_id: model.text().nullable(),
  /** Display name shown on the PDP — defaults to "Client Lehena" if null. */
  customer_name: model.text().nullable(),
  /** 1..5 inclusive, validated at workflow level. */
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text(),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  approved_at: model.dateTime().nullable(),
  /** Admin user id (auth_identity_id) that approved the review. */
  approved_by: model.text().nullable(),
  /** Snapshot of the order that originated the review — eligibility proof. */
  order_id: model.text().nullable(),
})

export default Review
