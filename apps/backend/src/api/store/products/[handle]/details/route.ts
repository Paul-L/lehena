import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Store endpoint: full PDP payload for a single product handle.
 *
 * Returns the product joined with:
 * - product_details (all fields)
 * - variants + their calculated_price + variant_details (format, weight_grams)
 * - categories (top-level handle/name + parent chain for breadcrumbs)
 * - collection
 * - faq_items (sorted by position)
 *
 * The storefront consumes this once for the PDP; for listings it uses the
 * lighter /store/products-faceted endpoint.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { handle } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "subtitle",
      "description",
      "thumbnail",
      "status",
      "created_at",
      "tags.*",
      "images.id",
      "images.url",
      "images.rank",
      "categories.id",
      "categories.name",
      "categories.handle",
      "categories.parent_category.id",
      "categories.parent_category.handle",
      "categories.parent_category.name",
      "collection.id",
      "collection.handle",
      "collection.title",
      "options.id",
      "options.title",
      "options.values.id",
      "options.values.value",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_quantity",
      "variants.calculated_price.*",
      "variants.options.id",
      "variants.options.value",
      "variants.options.option.id",
      "variants.options.option.title",
      "variants.variant_details.id",
      "variants.variant_details.format",
      "variants.variant_details.weight_grams",
      "product_details.*",
      "faq_items.id",
      "faq_items.question",
      "faq_items.answer",
      "faq_items.position",
    ],
    filters: { handle, status: "published" },
  })

  const product = data[0]
  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  // Sort FAQ items by position (Medusa doesn't order linked lists for us).
  const faqItems = ((product as { faq_items?: unknown }).faq_items ?? []) as {
    id: string
    position: number
    created_at?: string | Date
  }[]
  faqItems.sort(
    (a, b) =>
      a.position - b.position ||
      String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  )

  return res.json({ product })
}
