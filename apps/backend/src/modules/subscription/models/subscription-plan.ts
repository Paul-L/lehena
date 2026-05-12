import { model } from "@medusajs/framework/utils"

/**
 * Subscription plan — the catalog of recurring offerings. Two seeded in V1:
 * "Découverte" (49 €/mo, 3 produits) and "Gourmet" (79 €/mo, 5 produits).
 *
 * The pricing is mirrored on Stripe as a recurring Price; the Stripe price
 * id lives in env so we can switch test/prod without touching the DB.
 *
 * Box content is curated monthly by the atelier — V1 does not let
 * customers pick what's inside.
 */
const SubscriptionPlan = model.define("subscription_plan", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name: model.text(),
  description: model.text().nullable(),
  /** Price in cents EUR — kept in sync manually with Stripe Price. */
  price_cents: model.number(),
  /** Recurring interval in days. 30 for monthly in V1. */
  frequency_days: model.number().default(30),
  /** Box size hint for the atelier copy + storefront card. */
  box_size: model.number(),
  hero_image_url: model.text().nullable(),
  /**
   * Stripe Price id (e.g. `price_1Q...`). Stored in env per-plan to keep
   * test/prod swappable, surfaced here for read-side convenience.
   */
  stripe_price_env_key: model.text(),
  /** Soft toggle so we can hide plans without deleting subscriptions. */
  active: model.boolean().default(true),
})

export default SubscriptionPlan
