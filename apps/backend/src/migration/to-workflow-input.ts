import {
  BREED_VALUES,
  ORIGIN_VALUES,
  VARIANT_FORMAT_VALUES,
  type Breed,
  type CatalogAdditionalData,
  type Origin,
  type ProductDetailsInput,
  type VariantDetailsInput,
  type VariantFormat,
} from "../modules/catalog/types"

import type { MappedProduct, MappedVariant } from "./mappers/product"

/**
 * Default DDM (date de durabilité minimale) when the WC export doesn't
 * carry one. Conservative; the operator can adjust per-product post-import.
 */
const DEFAULT_DDM_DAYS = 730

/**
 * Coerces a free-text origin (e.g. "Vallée des Aldudes") to one of the
 * controlled `ORIGIN_VALUES`. Unknown → "Autre" so the strict schema passes.
 */
function normalizeOrigin(raw: string | null): Origin {
  if (!raw) return "Autre"
  const lower = raw.toLowerCase()
  for (const v of ORIGIN_VALUES) {
    if (lower.includes(v.toLowerCase())) return v
  }
  return "Autre"
}

function normalizeBreed(raw: string | null): Breed | null {
  if (!raw) return null
  const lower = raw.toLowerCase()
  for (const v of BREED_VALUES) {
    if (lower.includes(v.toLowerCase())) return v
  }
  return "Autre"
}

/**
 * Maps a WC variant attribute label (e.g. "Demi", "Entier") to the
 * controlled `VARIANT_FORMAT_VALUES`. Best-effort; falls back to "autre"
 * which the storefront's format facet treats as "uncategorised".
 */
function normalizeFormat(attrs: Record<string, string>): VariantFormat {
  const raw = (attrs["format"] ?? attrs["Format"] ?? "").toLowerCase().trim()
  if (!raw) return "autre"
  const direct = VARIANT_FORMAT_VALUES.find((v) => v === raw)
  if (direct) return direct
  // Common WC labels seen in the Lehena export.
  if (/demi/.test(raw)) return "demi"
  if (/quart/.test(raw)) return "quart"
  if (/entier.*desoss/.test(raw)) return "entier_desosse"
  if (/entier/.test(raw)) return "entier_os"
  if (/tranche.*100/.test(raw)) return "tranches_100g"
  if (/tranche.*200/.test(raw)) return "tranches_200g"
  if (/coffret/.test(raw)) return "coffret"
  if (/unique|unit[eé]/.test(raw)) return "unite"
  if (/pi[eè]ce/.test(raw)) return "piece"
  return "autre"
}

function buildProductDetails(m: MappedProduct): ProductDetailsInput {
  return {
    aging_months: m.details.aging_months ?? null,
    origin: normalizeOrigin(m.details.origin),
    breed: normalizeBreed(m.details.breed),
    allergens: [],
    nitrite_free: m.details.nitrite_free,
    conservation_temp: m.details.conservation_temp,
    ddm_days: DEFAULT_DDM_DAYS,
    seo_title: m.seo_title,
    seo_description: m.seo_description,
    pairings_tags: [],
    noindex: false,
  }
}

function buildVariantDetails(v: MappedVariant): VariantDetailsInput | null {
  if (!v.sku || !v.weight_grams || v.weight_grams <= 0) return null
  return {
    sku: v.sku,
    weight_grams: v.weight_grams,
    format: normalizeFormat(v.options),
  }
}

export function buildCatalogAdditionalData(
  m: MappedProduct
): CatalogAdditionalData {
  return {
    product: buildProductDetails(m),
    variants: m.variants
      .map(buildVariantDetails)
      .filter((v): v is VariantDetailsInput => v !== null),
  }
}

export interface WorkflowResolvedContext {
  defaultSalesChannelId: string
  shippingProfileIds: { fresh: string; ambient: string }
  categoryIdByHandle: Map<string, string>
}

/**
 * Builds the `createProductsWorkflow` input payload for a single mapped
 * product. Returns null when prerequisites are missing (unknown category,
 * no priced variants) — the caller records a `skipped` outcome.
 */
export function buildWorkflowProductInput(
  m: MappedProduct,
  ctx: WorkflowResolvedContext
): {
  product: Record<string, unknown>
  additional_data: { catalog: CatalogAdditionalData }
} | null {
  const categoryId = ctx.categoryIdByHandle.get(m.category_handle)
  if (!categoryId) return null

  const pricedVariants = m.variants.filter(
    (v): v is MappedVariant & { price: number } =>
      typeof v.price === "number" && v.price > 0
  )
  if (pricedVariants.length === 0) return null

  const profileId =
    m.details.conservation_temp === "ambient"
      ? ctx.shippingProfileIds.ambient
      : ctx.shippingProfileIds.fresh

  const optionValues = Array.from(
    new Set(pricedVariants.map((v) => v.title))
  )

  return {
    product: {
      title: m.title,
      handle: m.handle,
      subtitle: m.subtitle,
      description: m.description,
      status: m.status,
      shipping_profile_id: profileId,
      category_ids: [categoryId],
      sales_channels: [{ id: ctx.defaultSalesChannelId }],
      ...(m.thumbnail
        ? {
            thumbnail: m.thumbnail,
            images: m.images.map((i) => ({ url: i.url })),
          }
        : {}),
      options: [{ title: "Format", values: optionValues }],
      variants: pricedVariants.map((v) => ({
        title: v.title,
        sku: v.sku,
        manage_inventory: false,
        allow_backorder: false,
        prices: [{ currency_code: "eur", amount: v.price }],
        options: { Format: v.title },
      })),
    },
    additional_data: { catalog: buildCatalogAdditionalData(m) },
  }
}
