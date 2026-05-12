import { mapCategoryToLehena } from "./product"

import type { LegacyProduct } from "../types"

export interface MappedRedirect {
  from_path: string
  to_path: string
  status: 301
  source: "product" | "category" | "page" | "manual"
  note: string | null
}

/**
 * Hardcoded mapping for the WP page URLs we know are out there. The
 * dynamic mapping (products + categories) happens in `mapProductRedirect`.
 * Source of truth: Phase 8 spec § f.
 */
export const STATIC_PAGE_REDIRECTS: MappedRedirect[] = [
  {
    from_path: "/notre-histoire/",
    to_path: "/fr/notre-histoire",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/de-la-ferme-a-lassiette/",
    to_path: "/fr/la-ferme",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/contactez-nous/",
    to_path: "/fr/contact",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/actualites/",
    to_path: "/fr/journal",
    status: 301,
    source: "page",
    note: "Journal SEO Phase 9 — fallback /fr/journal en attendant",
  },
  {
    from_path: "/cgv/",
    to_path: "/fr/cgv",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/mentions-legales/",
    to_path: "/fr/mentions-legales",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/privacy-policy/",
    to_path: "/fr/politique-confidentialite",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/mon-compte-2/",
    to_path: "/fr/account",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/mon-compte/",
    to_path: "/fr/account",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/panier/",
    to_path: "/fr/cart",
    status: 301,
    source: "page",
    note: null,
  },
  {
    from_path: "/commander/",
    to_path: "/fr/checkout",
    status: 301,
    source: "page",
    note: null,
  },
]

/**
 * Builds the per-product 301 from the legacy WP URL to the new Medusa PDP.
 * WP uses `/produit/<slug>/`. We preserve the slug 1:1.
 */
export function mapProductRedirect(p: LegacyProduct): MappedRedirect {
  return {
    from_path: `/produit/${p.slug}/`,
    to_path: `/fr/products/${p.slug}`,
    status: 301,
    source: "product",
    note: null,
  }
}

/**
 * Per-category 301. WP uses `/categorie-produit/<slug>/`. Multiple legacy
 * categories collapse into our 7 destination handles via the same map as
 * the product mapper.
 */
export function mapCategoryRedirect(input: {
  legacy_slug: string
}): MappedRedirect {
  const target = mapCategoryToLehena([input.legacy_slug])
  return {
    from_path: `/categorie-produit/${input.legacy_slug}/`,
    to_path: `/fr/categories/${target}`,
    status: 301,
    source: "category",
    note: null,
  }
}

/**
 * Generates the redirect for a product that got *consolidated* (5 legacy
 * SKUs merged into 1 product + 5 variants). We can't faithfully restore
 * the variant pick from a static URL, but we can land the visitor on the
 * PDP with a hint query string the storefront recognises.
 */
export function mapConsolidatedProductRedirect(input: {
  legacy_slug: string
  target_slug: string
  variant_hint: string
}): MappedRedirect {
  return {
    from_path: `/produit/${input.legacy_slug}/`,
    to_path: `/fr/products/${input.target_slug}?variant=${encodeURIComponent(
      input.variant_hint
    )}`,
    status: 301,
    source: "product",
    note: `Consolidé depuis ${input.legacy_slug}`,
  }
}
