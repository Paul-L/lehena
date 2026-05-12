import type { LegacyProduct } from "../types"

/**
 * Maps a WooCommerce product to the input shape consumed by Medusa's
 * `createProductsWorkflow`. We keep the result loose-typed because the
 * Medusa workflow types are large and surface-changing; the shape we
 * return is what `createProductsWorkflow.run({ input: { products: [...] } })`
 * accepts in 2.15+.
 *
 * Categorisation rules (cf. ADR Phase 1):
 *  - WC categories `accessoire` / `support` / `planche` / `couteau` → "accessoires"
 *  - Anything containing "jambon" → "jambons-iparralde"
 *  - "saucisson" / "chorizo" / "salaison" → "salaisons"
 *  - "patxaran" / "spiritueux" / "liqueur" → "patxaran-spiritueux"
 *  - "coffret" / "cadeau" → "coffrets-cadeaux"
 *  - Default: "epicerie-basque"
 */

const CATEGORY_MAP: { match: RegExp; target: string }[] = [
  { match: /accessoire|support|planche|couteau/i, target: "accessoires" },
  { match: /jambon/i, target: "jambons-iparralde" },
  { match: /saucisson|chorizo|salaison|saucisse/i, target: "salaisons" },
  { match: /patxaran|spiritueux|liqueur/i, target: "patxaran-spiritueux" },
  { match: /coffret|cadeau/i, target: "coffrets-cadeaux" },
]

export function mapCategoryToLehena(legacyCategorySlugs: string[]): string {
  for (const slug of legacyCategorySlugs) {
    for (const rule of CATEGORY_MAP) {
      if (rule.match.test(slug)) return rule.target
    }
  }
  return "epicerie-basque"
}

/** Stripped product-details payload — used by the link Phase 1 ships. */
export interface MappedProductDetails {
  aging_months: number | null
  origin: string | null
  breed: string | null
  nitrite_free: boolean
  conservation_temp: "ambient" | "fresh" | "frozen"
  weight_grams: number | null
}

export function mapProductDetails(p: LegacyProduct): MappedProductDetails {
  const meta = p.meta
  const aging = pickNumber(meta["aging_months"] ?? meta["_aging_months"])
  const origin = pickString(meta["origin"] ?? meta["_origin"])
  const breed = pickString(meta["breed"] ?? meta["_breed"])
  const nitriteFree = ((): boolean => {
    if (meta["nitrite_free"] === true) return true
    if (typeof meta["nitrite_free"] === "string") {
      return /^(true|yes|sans-nitrite|sans_nitrite)$/i.test(
        meta["nitrite_free"]
      )
    }
    // Tag-based fallback.
    return p.tags.some((t) => /sans[-_ ]?nitrite/i.test(t))
  })()
  const conservationTemp: "ambient" | "fresh" | "frozen" = (() => {
    const raw = pickString(meta["conservation_temp"])
    if (raw === "fresh" || raw === "frozen") return raw
    // Salaisons / jambons are fresh by default — same heuristic as the
    // shipping-profile assignment used by the cold-chain logic.
    if (/jambon|saucisson|salaison|chorizo|frais/i.test(p.name)) return "fresh"
    return "ambient"
  })()
  return {
    aging_months: aging,
    origin,
    breed,
    nitrite_free: nitriteFree,
    conservation_temp: conservationTemp,
    weight_grams: p.weight_grams,
  }
}

export interface MappedProduct {
  title: string
  handle: string
  subtitle: string | null
  description: string | null
  status: "draft" | "published"
  category_handle: string
  tags: string[]
  images: { url: string }[]
  thumbnail: string | null
  /** Re-hosted image src → original src so the media script can re-fetch. */
  legacy_image_sources: string[]
  variants: MappedVariant[]
  details: MappedProductDetails
  /** SEO fields read from Yoast meta. */
  seo_title: string | null
  seo_description: string | null
}

export interface MappedVariant {
  title: string
  sku: string | null
  /** Cents, EUR — Medusa's storage unit. */
  price_cents: number | null
  weight_grams: number | null
  options: Record<string, string>
}

export function mapProduct(p: LegacyProduct): MappedProduct {
  const status = p.status === "publish" ? "published" : "draft"
  const variants: MappedVariant[] =
    p.variations.length > 0
      ? p.variations.map((v) => ({
          title: variationTitle(v.attributes),
          sku: v.sku,
          price_cents: priceToCents(v.price),
          weight_grams: v.weight_grams,
          options: v.attributes,
        }))
      : [
          {
            title: "Format unique",
            sku: p.sku,
            price_cents: priceToCents(p.price ?? null),
            weight_grams: p.weight_grams,
            options: { format: "Unique" },
          },
        ]

  return {
    title: p.name,
    handle: p.slug,
    subtitle: p.short_description,
    description: stripHtml(p.description),
    status,
    category_handle: mapCategoryToLehena(p.categories.map((c) => c.slug)),
    tags: p.tags,
    images: p.images.map((i) => ({ url: i.src })),
    thumbnail: p.images[0]?.src ?? null,
    legacy_image_sources: p.images.map((i) => i.src),
    variants,
    details: mapProductDetails(p),
    seo_title: pickString(p.meta["_yoast_wpseo_title"]),
    seo_description: pickString(p.meta["_yoast_wpseo_metadesc"]),
  }
}

function variationTitle(attrs: Record<string, string>): string {
  const parts = Object.entries(attrs).map(([k, v]) => `${humanize(k)} ${v}`)
  return parts.length > 0 ? parts.join(" · ") : "Format"
}

function humanize(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\bpa_/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function priceToCents(raw: string | null): number | null {
  if (!raw) return null
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100)
}

function pickNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.length > 0) return v
  return null
}

function stripHtml(raw: string | null): string | null {
  if (!raw) return null
  // Minimal — we want to lose the WC <p> wrappers without losing line
  // breaks. Anything richer (TipTap conversion etc.) is a Phase 9 chore.
  return (
    raw
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/\s*p\s*>\s*<\s*p[^>]*>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim() || null
  )
}
