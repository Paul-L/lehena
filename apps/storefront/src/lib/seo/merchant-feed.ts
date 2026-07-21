/**
 * Serializes Lehena products into a Google Merchant Center feed
 * (RSS 2.0 + the `xmlns:g` namespace).
 *
 * This module is PURE: it takes already-fetched products plus options and
 * returns an XML string. No network, no Next.js, no env access — that keeps
 * it trivially testable and reusable.
 *
 * Spec: https://support.google.com/merchants/answer/7052112
 * One `<item>` per VARIANT; variants of the same product are linked via
 * `g:item_group_id`.
 */

import { type HttpTypes } from "@medusajs/types"

import {
  resolveGoogleProductCategory,
  resolveProductType,
  type FeedCategory,
} from "./google-product-category"

import type {
  EnrichedProduct,
  VariantDetailsCatalog,
} from "@lib/data/product-details"

const BRAND = "Maison Lehena"
const MAX_TITLE = 150
const MAX_DESCRIPTION = 5000
const MAX_ADDITIONAL_IMAGES = 10

export interface BuildMerchantFeedOptions {
  /** Absolute site origin, e.g. "https://lehena.fr" (no trailing slash). */
  baseUrl: string
  /** Locale prefix used for PDP links. Defaults to "fr". */
  locale?: string
  /** Currency code fallback when a variant price omits one. Defaults "EUR". */
  currency?: string
}

/** Escape a raw string for safe inclusion in XML text / attributes. */
export function xmlEscape(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Strip HTML tags and collapse whitespace. */
function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value
}

/** Turn a possibly-relative image path into an absolute HTTPS URL. */
function absoluteUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}/${url.replace(/^\//, "")}`
}

type FeedVariant = HttpTypes.StoreProductVariant & {
  variant_details?: VariantDetailsCatalog | null
}

/** Collect the primary + additional image URLs for a product (absolute). */
function collectImages(product: EnrichedProduct, baseUrl: string): string[] {
  const urls: string[] = []
  if (product.thumbnail) urls.push(product.thumbnail)
  for (const img of product.images ?? []) {
    if (img?.url) urls.push(img.url)
  }
  // De-dupe while preserving order, then absolutize.
  const seen = new Set<string>()
  const result: string[] = []
  for (const u of urls) {
    const abs = absoluteUrl(u, baseUrl)
    if (!seen.has(abs)) {
      seen.add(abs)
      result.push(abs)
    }
  }
  return result
}

/**
 * Derive availability. We treat a tracked variant with no remaining stock as
 * `out_of_stock` (never omit the item — a temporarily OOS item that stays in
 * the feed keeps its Shopping history). Untracked variants are `in_stock`.
 */
function availabilityFor(variant: FeedVariant): "in_stock" | "out_of_stock" {
  const qty = variant.inventory_quantity
  if (typeof qty === "number" && qty <= 0) return "out_of_stock"
  return "in_stock"
}

interface PriceInfo {
  amount: number
  currency: string
}

function priceFor(
  variant: FeedVariant,
  fallbackCurrency: string
): PriceInfo | null {
  const calc = variant.calculated_price
  const amount = calc?.calculated_amount
  if (typeof amount !== "number" || amount <= 0) return null
  const currency = (calc?.currency_code ?? fallbackCurrency).toUpperCase()
  return { amount, currency }
}

/** Build one `<g:custom_label_N>` line if the value is present. */
function customLabels(product: EnrichedProduct): string[] {
  const details = product.product_details
  const lines: string[] = []
  if (!details) return lines

  const pushLabel = (index: number, value: string | null | undefined) => {
    if (value && value.trim()) {
      lines.push(tag(`g:custom_label_${index}`, value.trim()))
    }
  }

  pushLabel(0, details.nitrite_free ? "sans_nitrite" : null)
  pushLabel(
    1,
    typeof details.aging_months === "number" && details.aging_months > 0
      ? `affinage_${details.aging_months}mois`
      : null
  )
  pushLabel(2, details.breed)
  pushLabel(3, details.origin)
  return lines
}

/** Render a `<name>escaped-value</name>` element. */
function tag(name: string, value: string): string {
  return `<${name}>${xmlEscape(value)}</${name}>`
}

function buildItem(
  product: EnrichedProduct,
  variant: FeedVariant,
  images: string[],
  opts: Required<BuildMerchantFeedOptions>
): string | null {
  const price = priceFor(variant, opts.currency)
  if (!price) return null

  const primaryImage = images[0]
  const additionalImages = images.slice(1, 1 + MAX_ADDITIONAL_IMAGES)

  const link = `${opts.baseUrl}/${opts.locale}/products/${product.handle}`

  // Distinct titles per variant (Google prefers unique titles for a group).
  let title = product.title ?? ""
  if (
    variant.title &&
    variant.title.trim() &&
    variant.title !== product.title
  ) {
    title = `${title} - ${variant.title}`
  }
  title = truncate(title, MAX_TITLE)

  const rawDescription =
    product.description ?? product.subtitle ?? product.title ?? ""
  const description = truncate(stripHtml(rawDescription), MAX_DESCRIPTION)

  const categories = (product.categories ?? []) as FeedCategory[]
  const googleCategory = resolveGoogleProductCategory(categories)
  const productType = resolveProductType(categories)

  const lines: string[] = [
    tag("g:id", variant.id),
    tag("g:item_group_id", product.id),
    tag("g:title", title),
    tag("g:description", description),
    tag("g:link", link),
    tag("g:image_link", primaryImage),
    ...additionalImages.map((url) => tag("g:additional_image_link", url)),
    tag("g:availability", availabilityFor(variant)),
    tag("g:price", `${price.amount.toFixed(2)} ${price.currency}`),
    tag("g:brand", BRAND),
    tag("g:condition", "new"),
    tag("g:google_product_category", googleCategory),
  ]

  if (productType) lines.push(tag("g:product_type", productType))

  // No GTIN/EAN in the catalog → advertise MPN (SKU) and flag no identifiers.
  if (variant.sku) lines.push(tag("g:mpn", variant.sku))
  lines.push(tag("g:identifier_exists", "no"))

  const weightGrams = variant.variant_details?.weight_grams
  if (typeof weightGrams === "number" && weightGrams > 0) {
    lines.push(tag("g:shipping_weight", `${weightGrams} g`))
  }

  lines.push(tag("g:size_type", "regular"))
  lines.push(...customLabels(product))

  return `    <item>\n      ${lines.join("\n      ")}\n    </item>`
}

/**
 * Serialize the given products into the Google Merchant feed XML string.
 * Filtering rules:
 *  - non-published products are dropped
 *  - products without any image are dropped
 *  - variants without a positive price are dropped
 *  - if every variant of a product is dropped, the product produces no items
 */
export function buildMerchantFeed(
  products: EnrichedProduct[],
  options: BuildMerchantFeedOptions
): string {
  const opts: Required<BuildMerchantFeedOptions> = {
    baseUrl: options.baseUrl.replace(/\/$/, ""),
    locale: options.locale ?? "fr",
    currency: (options.currency ?? "EUR").toUpperCase(),
  }

  const items: string[] = []

  for (const product of products) {
    if (product.status && product.status !== "published") continue

    const images = collectImages(product, opts.baseUrl)
    if (!images.length) continue
    if (!product.handle) continue

    const variants = (product.variants ?? []) as FeedVariant[]
    for (const variant of variants) {
      const item = buildItem(product, variant, images, opts)
      if (item) items.push(item)
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    "    <title>Maison Lehena</title>",
    `    <link>${xmlEscape(opts.baseUrl)}</link>`,
    "    <description>Charcuterie et salaisons artisanales du Pays Basque</description>",
    items.join("\n"),
    "  </channel>",
    "</rss>",
  ].join("\n")
}
