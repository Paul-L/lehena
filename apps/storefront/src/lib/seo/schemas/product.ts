import { getBaseURL } from "@lib/util/env"

import { SITE_NAME } from "../metadata"

import { nutritionInformation } from "./nutrition"
import { merchantReturnPolicy } from "./return-policy"
import { offerShippingDetails } from "./shipping"

import type { NutritionInformationSchema } from "./nutrition"
import type { MerchantReturnPolicySchema } from "./return-policy"
import type { OfferShippingDetailsSchema } from "./shipping"
import type {
  EnrichedProduct,
  ProductDetailsCatalog,
} from "@lib/data/product-details"

/** A single approved review to surface in the schema (top 3 max). */
export interface ProductReviewInput {
  authorName: string
  /** ISO date (any parseable value); emitted as YYYY-MM-DD. */
  date: string | null
  rating: number
  body: string
}

interface ProductSchemaInput {
  product: EnrichedProduct
  countryCode: string
  /** Real aggregate rating — omit entirely when there are no reviews. */
  aggregateRating?: { ratingValue: number; reviewCount: number }
  /** Top approved reviews (already sorted); only the first 3 are emitted. */
  reviews?: ProductReviewInput[]
}

export interface PropertyValueSchema {
  "@type": "PropertyValue"
  name: string
  value: string
}

export interface OrganizationRefSchema {
  "@id": string
}

export interface AggregateRatingSchema {
  "@type": "AggregateRating"
  ratingValue: string
  reviewCount: number
  bestRating: string
  worstRating: string
}

export interface ReviewSchema {
  "@type": "Review"
  author: { "@type": "Person"; name: string }
  datePublished?: string
  reviewRating: {
    "@type": "Rating"
    ratingValue: string
    bestRating: string
    worstRating: string
  }
  reviewBody: string
}

export interface OfferSchema {
  "@type": "Offer"
  url: string
  priceCurrency: string
  price: string
  priceValidUntil: string
  availability: string
  itemCondition: string
  mpn?: string
  seller: OrganizationRefSchema
  hasMerchantReturnPolicy: MerchantReturnPolicySchema
  shippingDetails: OfferShippingDetailsSchema
}

/** Cheapest variant amount + currency + sku for the offer block. */
function cheapestOffer(
  product: EnrichedProduct
): { amount: number; currency: string; sku: string | null } | null {
  let min: { amount: number; currency: string; sku: string | null } | null =
    null
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
          sku: v.sku ?? null,
        }
      }
    }
  }
  return min
}

function toIsoDate(value: string | null): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10)
}

/**
 * Schema.org Product for a PDP.
 *
 * Multi-variant note: we emit a single `Offer` for the cheapest variant
 * rather than an `AggregateOffer`. Lehena variants are the same product in
 * different formats (whole / half / sliced), so one canonical price with a
 * "from" semantics keeps the rich result clean; AggregateOffer is not
 * required here.
 *
 * Never emits null/undefined: undefined keys are dropped by JSON.stringify,
 * and array/aggregate blocks are only attached when they carry real data.
 */
export function productSchema({
  product,
  countryCode,
  aggregateRating,
  reviews,
}: ProductSchemaInput): Record<string, unknown> {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const url = `${baseUrl}/${countryCode}/products/${product.handle}`
  const orgId = `${baseUrl}/#organization`
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

  const category = product.categories?.[0]?.name ?? null
  const mpn = offer?.sku ?? product.variants?.[0]?.sku ?? null

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    url,
    sku: product.variants?.[0]?.sku ?? undefined,
    mpn: mpn ?? undefined,
    category: category ?? undefined,
    image: images.length > 0 ? images : undefined,
    description: description ?? undefined,
    // Brand as Organization, linked to the site-wide Organization node so
    // it connects to the Knowledge Panel instead of being a bare Brand.
    brand: {
      "@type": "Organization",
      "@id": orgId,
      name: SITE_NAME,
      url: baseUrl,
      logo: `${baseUrl}/assets/logo-lehena.png`,
    },
    manufacturer: { "@id": orgId },
  }

  const additionalProperty: PropertyValueSchema[] = []
  if (details?.origin) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Origine",
      value: details.origin,
    })
  }
  if (details?.breed) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Race",
      value: details.breed,
    })
  }
  if (details?.aging_months) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Affinage",
      value: `${details.aging_months} mois`,
    })
  }
  if (details?.nitrite_free) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Sans nitrite",
      value: "oui",
    })
  }
  if (details?.allergens && details.allergens.length > 0) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Allergènes",
      value: details.allergens.join(", "),
    })
  }
  if (details?.ingredients) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Ingrédients",
      value: details.ingredients,
    })
  }
  if (additionalProperty.length > 0) {
    schema.additionalProperty = additionalProperty
  }

  if (offer) {
    const offerSchema: OfferSchema = {
      "@type": "Offer",
      url,
      priceCurrency: offer.currency,
      price: offer.amount.toFixed(2),
      priceValidUntil,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": orgId },
      hasMerchantReturnPolicy: merchantReturnPolicy(),
      shippingDetails: offerShippingDetails(),
    }
    if (mpn) offerSchema.mpn = mpn
    schema.offers = offerSchema
  }

  const nutrition: NutritionInformationSchema | null = nutritionInformation(
    details?.nutritional
  )
  if (nutrition) {
    schema.nutrition = nutrition
  }

  // Never emit aggregateRating / review when there are no reviews (Google
  // treats a 0-count aggregate as a blocking warning).
  if (aggregateRating && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: "5",
      worstRating: "1",
    } satisfies AggregateRatingSchema
  }

  if (reviews && reviews.length > 0) {
    const reviewSchemas: ReviewSchema[] = reviews.slice(0, 3).map((r) => {
      const item: ReviewSchema = {
        "@type": "Review",
        author: { "@type": "Person", name: r.authorName },
        reviewRating: {
          "@type": "Rating",
          ratingValue: String(r.rating),
          bestRating: "5",
          worstRating: "1",
        },
        reviewBody: r.body,
      }
      const published = toIsoDate(r.date)
      if (published) item.datePublished = published
      return item
    })
    schema.review = reviewSchemas
  }

  return schema
}
