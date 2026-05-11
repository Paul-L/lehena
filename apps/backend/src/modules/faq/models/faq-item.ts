import { model } from "@medusajs/framework/utils"

/**
 * A single Q&A pair attached to a product. One product owns N items;
 * items are not shared across products. Ordering is editorial via `position`.
 */
const FaqItem = model.define("faq_item", {
  id: model.id().primaryKey(),
  question: model.text(),
  answer: model.text(),
  position: model.number().default(0),
})

export default FaqItem
