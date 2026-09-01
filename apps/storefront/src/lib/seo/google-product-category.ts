/**
 * Maps our Medusa product categories to Google's official
 * `google_product_category` taxonomy (English strings, `>`-separated).
 *
 * Google matches the string against its taxonomy; a mildly wrong leaf is a
 * non-blocking warning, an outright missing value is fine (Google will guess)
 * but hurts placement. We key on the ROOT category handle so sub-categories
 * inherit their parent's mapping.
 *
 * Taxonomy reference: https://support.google.com/merchants/answer/6324436
 */

export const GOOGLE_PRODUCT_CATEGORY_FALLBACK =
  "Food, Beverages & Tobacco > Food Items"

/** Root Medusa category handle → Google product category. */
const ROOT_HANDLE_TO_GOOGLE: Record<string, string> = {
  // Jambons / dry-cured ham
  "jambons-iparralde":
    "Food, Beverages & Tobacco > Food Items > Meat & Seafood > Meat",
  // Salaisons (ventrèches, saucissons secs, chorizos…) — cured meats
  salaisons: "Food, Beverages & Tobacco > Food Items > Meat & Seafood > Meat",
  // Patxaran & spirits — liqueurs / spirits
  "patxaran-spiritueux":
    "Food, Beverages & Tobacco > Beverages > Alcoholic Beverages > Liquor & Spirits",
  // Épicerie fine — piperade, piment d'Espelette, conserves…
  "epicerie-fine": "Food, Beverages & Tobacco > Food Items",
  // Plats cuisinés — prepared / ready meals
  "plats-cuisines": "Food, Beverages & Tobacco > Food Items > Prepared Foods",
  // Coffrets & cadeaux — gift baskets
  "coffrets-cadeaux": "Food, Beverages & Tobacco > Food Gift Baskets",
  // Accessoires — ham stands, carving knives, boards
  accessoires: "Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils",
}

/** A category as returned by the store products/details endpoint. */
export interface FeedCategory {
  handle?: string | null
  name?: string | null
  parent_category?: FeedCategory | null
}

/**
 * Reduce any category handle to its root segment. Our seed uses nested
 * handles like `jambons-iparralde/orhi-entier`; older/flat handles have no
 * slash and are returned as-is.
 */
function rootSegment(handle: string): string {
  return handle.split("/")[0]
}

/**
 * Resolve the Google product category for a product from its categories.
 * Walks each category's parent chain up to the root and tries the root
 * handle first, then the raw handle, then the leading path segment.
 */
export function resolveGoogleProductCategory(
  categories: FeedCategory[] | null | undefined
): string {
  if (!categories?.length) return GOOGLE_PRODUCT_CATEGORY_FALLBACK

  for (const category of categories) {
    // Walk to the root of the parent chain.
    let node: FeedCategory | null | undefined = category
    let root: FeedCategory = category
    while (node) {
      root = node
      node = node.parent_category
    }

    const candidates = [
      root.handle,
      category.handle,
      root.handle ? rootSegment(root.handle) : undefined,
      category.handle ? rootSegment(category.handle) : undefined,
    ]

    for (const candidate of candidates) {
      if (candidate && ROOT_HANDLE_TO_GOOGLE[candidate]) {
        return ROOT_HANDLE_TO_GOOGLE[candidate]
      }
    }
  }

  return GOOGLE_PRODUCT_CATEGORY_FALLBACK
}

/**
 * Build the internal `product_type` string (our own taxonomy, not Google's)
 * from the most specific category's name chain, e.g.
 * "Jambons d'Iparralde > Orhi entier".
 */
export function resolveProductType(
  categories: FeedCategory[] | null | undefined
): string | null {
  if (!categories?.length) return null

  // Prefer the category with the deepest parent chain (most specific).
  let best: FeedCategory | null = null
  let bestDepth = -1
  for (const category of categories) {
    let depth = 0
    let node: FeedCategory | null | undefined = category.parent_category
    while (node) {
      depth++
      node = node.parent_category
    }
    if (depth > bestDepth) {
      bestDepth = depth
      best = category
    }
  }
  if (!best) return null

  const names: string[] = []
  let node: FeedCategory | null | undefined = best
  while (node) {
    if (node.name) names.unshift(node.name)
    node = node.parent_category
  }
  return names.length ? names.join(" > ") : null
}
