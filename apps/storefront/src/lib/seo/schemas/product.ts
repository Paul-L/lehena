import { getBaseURL } from "@lib/util/env"

import { SITE_NAME } from "../metadata"

import type {
  EnrichedProduct,
  ProductDetailsCatalog,
} from "@lib/data/product-details"

interface ProductSchemaInput {
  product: EnrichedProduct
  countryCode: string
  /** Optional mock aggregate rating until reviews land in Phase 10. */
  aggregateRating?: { ratingValue: number; reviewCount: number }
}

/** Cheapest variant amount + currency for the offer block. */
function cheapestOffer(
  product: EnrichedProduct
): { amount: number; currency: string } | null {
  let min: { amount: number; currency: string } | null = null
  for (const v of product.variants ?? []) {
    const price = (
      v as {
        calculated_price?: {
          calculated_amount?: number | null
          currency_code?: string | null
        } | null
      }
    ).calculated_price
    if (
      typeof price?.calculated_amount === "number" &&
      typeof price?.currency_code === "string"
    ) {
      if (min === null || price.calculated_amount < min.amount) {
        min = {
          amount: price.calculated_amount,
          currency: price.currency_code.toUpperCase(),
        }
      }
    }
  }
  return min
}

/** Schema.org Product with Offer + Brand. AggregateRating is optional. */
export function productSchema({
  product,
  countryCode,
  aggregateRating,
}: ProductSchemaInput) {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const url = `${baseUrl}/${countryCode}/products/${product.handle}`
  const offer = cheapestOffer(product)
  const details = (product.product_details ??
    null) as ProductDetailsCatalog | null

  const images = (product.images ?? [])
    .map((i) => i.url)
    .filter((u): u is string => Boolean(u))
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }

  // priceValidUntil = +1 year from today (Google warns if absent).
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const description =
    details?.terroir_story ?? product.description ?? product.subtitle ?? null

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    url,
    sku: product.variants?.[0]?.sku ?? undefined,
    image: images.length > 0 ? images : undefined,
    description: description ?? undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
  }

  if (details?.origin || details?.breed) {
    schema.additionalProperty = [
      details.origin
        ? { "@type": "PropertyValue", name: "Origine", value: details.origin }
        : null,
      details.breed
        ? { "@type": "PropertyValue", name: "Race", value: details.breed }
        : null,
      details.aging_months
        ? {
            "@type": "PropertyValue",
            name: "Affinage",
            value: `${details.aging_months} mois`,
          }
        : null,
      details.nitrite_free
        ? {
            "@type": "PropertyValue",
            name: "Sans nitrite",
            value: "oui",
          }
        : null,
    ].filter(Boolean)
  }

  if (offer) {
    schema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: offer.currency,
      price: offer.amount.toFixed(2),
      priceValidUntil,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    }
  }

  if (aggregateRating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    }
  }

  return schema
}
