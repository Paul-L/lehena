import { model } from "@medusajs/framework/utils"

/**
 * One row per (customer, product[, variant]). We don't materialise the
 * "Wishlist" entity itself in V1 — every customer has an implicit single
 * wishlist. If a named-list feature ever lands, add a Wishlist parent with
 * a `belongs_to` reverse here.
 */
const WishlistItem = model.define("wishlist_item", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
})

export default WishlistItem
