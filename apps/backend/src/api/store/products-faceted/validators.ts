import { z } from "zod"

import {
  BREED_VALUES,
  ORIGIN_VALUES,
  VARIANT_FORMAT_VALUES,
} from "../../../modules/catalog/types"

/** Comma-separated list → string[] (max 20). */
const csv = (max = 20) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v)
        ? v
        : v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
    )
    .pipe(z.array(z.string().min(1)).max(max))

export const ListFacetedProductsQuerySchema = z
  .object({
    // pagination
    limit: z.coerce.number().int().min(1).max(100).default(24),
    offset: z.coerce.number().int().min(0).default(0),

    // currency / region context
    region_id: z.string().min(1).optional(),
    country_code: z.string().length(2).optional(),

    // text search (light SQL ilike; full-text via Meili lands in Phase 3d)
    q: z.string().min(1).max(200).optional(),

    // category filter (single handle, path like "jambons-iparralde")
    category_handle: z.string().min(1).max(120).optional(),

    // ─── Catalog facets (filter on product_details) ────────────────
    aging_min: z.coerce.number().int().min(0).max(120).optional(),
    aging_max: z.coerce.number().int().min(0).max(120).optional(),
    nitrite_free: z
      .union([z.literal("true"), z.literal("false"), z.boolean()])
      .transform((v) => (typeof v === "boolean" ? v : v === "true"))
      .optional(),
    breed: csv(8)
      .pipe(z.array(z.enum(BREED_VALUES)).max(8))
      .optional(),
    origin: csv(8)
      .pipe(z.array(z.enum(ORIGIN_VALUES)).max(8))
      .optional(),
    /** Exclude products whose `allergens` array intersects with these (e.g. "gluten,lactose"). */
    allergens_excluded: csv(14).optional(),

    // ─── Variant-level facet (filter on variant_details) ───────────
    format: csv(8)
      .pipe(z.array(z.enum(VARIANT_FORMAT_VALUES)).max(8))
      .optional(),

    // ─── Sort ──────────────────────────────────────────────────────
    sort: z
      .enum(["created_at", "price_asc", "price_desc", "title"])
      .default("created_at"),
  })
  .strict()

export type ListFacetedProductsQuerySchema = z.infer<
  typeof ListFacetedProductsQuerySchema
>
