import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import FaqModule from "../modules/faq"

// 1-to-many at the application level: a product owns N FAQ items, each item
// belongs to exactly one product. Enforced by the upsert workflow rather than
// the link schema (which is technically M-N). deleteCascade=true so deleting a
// product wipes its FAQ items.
export default defineLink(ProductModule.linkable.product, {
  linkable: FaqModule.linkable.faqItem,
  deleteCascade: true,
  isList: true,
})
