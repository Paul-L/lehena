import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils"

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

  // ─── Resolve pricing context ───────────────────────────────────────
  // `variants.calculated_price` requires a currency_code in the query
  // context. We derive it from the region the storefront sends along.
  // Without it, the pricing module throws and the PDP would 404.
  const regionId = req.query.region_id as string | undefined
  const countryCode = req.query.country_code as string | undefined
  let pricingContext:
    | { region_id: string; currency_code: string; country_code?: string }
    | null = null
  if (regionId) {
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: { id: regionId },
    })
    const region = regions?.[0] as
      | { id: string; currency_code: string }
      | undefined
    if (!region) {
      return res.status(400).json({ message: `Region ${regionId} not found` })
    }
    pricingContext = {
      region_id: region.id,
      currency_code: region.currency_code,
    }
    if (countryCode) {
      pricingContext.country_code = countryCode
    }
  }

  const fields = [
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
  ]
  if (pricingContext) {
    fields.push("variants.calculated_price.*")
  }

  const { data } = await query.graph({
    entity: "product",
    fields,
    filters: { handle, status: "published" },
    ...(pricingContext
      ? {
          context: {
            variants: {
              calculated_price: QueryContext(pricingContext),
            },
          },
        }
      : {}),
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
