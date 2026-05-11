import { AGING_BUCKETS } from "./facet-constants"
import { type FacetParams, type FacetSort } from "./products-faceted"

type RawSearchParams = Record<string, string | string[] | undefined>

const csv = (raw: string | string[] | undefined): string[] => {
  if (!raw) return []
  const value = Array.isArray(raw) ? raw.join(",") : raw
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

const SORTS: readonly FacetSort[] = [
  "created_at",
  "price_asc",
  "price_desc",
] as const

/**
 * Parse search params into a FacetParams object the data fetcher understands.
 * Defaults (page=1, sort=created_at, limit=12) are applied.
 */
export function parseFacetsFromSearchParams(
  raw: RawSearchParams,
  base: Pick<FacetParams, "countryCode" | "category_handle">
): { facets: FacetParams; agingBucketId: string | null; appliedCount: number } {
  const pageRaw =
    typeof raw.page === "string"
      ? raw.page
      : Array.isArray(raw.page)
        ? raw.page[0]
        : undefined
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1)

  const sortRaw =
    typeof raw.sort === "string"
      ? raw.sort
      : Array.isArray(raw.sort)
        ? raw.sort[0]
        : undefined
  const sort = (SORTS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as FacetSort)
    : "created_at"

  const nitriteRaw =
    typeof raw.nitrite_free === "string"
      ? raw.nitrite_free
      : Array.isArray(raw.nitrite_free)
        ? raw.nitrite_free[0]
        : undefined
  const nitrite_free = nitriteRaw === "true" ? true : undefined

  const agingBucketId =
    typeof raw.aging === "string"
      ? raw.aging
      : Array.isArray(raw.aging)
        ? (raw.aging[0] ?? null)
        : null
  const aging = AGING_BUCKETS.find((b) => b.id === agingBucketId)

  const breed = csv(raw.breed)
  const origin = csv(raw.origin)
  const allergens_excluded = csv(raw.allergens_excluded)
  const format = csv(raw.format)

  let appliedCount = 0
  if (aging) appliedCount++
  if (nitrite_free) appliedCount++
  appliedCount += breed.length
  appliedCount += origin.length
  appliedCount += allergens_excluded.length
  appliedCount += format.length

  const facets: FacetParams = {
    page,
    sort,
    countryCode: base.countryCode,
    category_handle: base.category_handle,
    nitrite_free,
    aging_min: aging?.min,
    aging_max: aging?.max,
    breed: breed.length > 0 ? breed : undefined,
    origin: origin.length > 0 ? origin : undefined,
    allergens_excluded:
      allergens_excluded.length > 0 ? allergens_excluded : undefined,
    format: format.length > 0 ? format : undefined,
  }

  return { facets, agingBucketId: aging?.id ?? null, appliedCount }
}
