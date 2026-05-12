/**
 * Source-agnostic shape of the data we ingest from the legacy WooCommerce
 * store. Both the live REST reader and the CSV fixture reader produce these
 * objects so the mappers + scripts don't care about the source format.
 *
 * Field names mirror WooCommerce's REST API v3 vocabulary where useful, but
 * we make every field that the mapper needs explicit instead of carrying
 * arbitrary `attributes` blobs around.
 */

export interface LegacyProduct {
  /** WooCommerce numeric id, kept for traceability + dedupe. */
  id: number
  /** WooCommerce slug — used to build the source URL for redirects. */
  slug: string
  name: string
  type: "simple" | "variable" | "grouped" | "external"
  status: "publish" | "draft" | "pending" | "private"
  description: string | null
  short_description: string | null
  /** Default price in € as decimal string ("12.90"). Empty when variable. */
  price: string | null
  sku: string | null
  /** Bytes; null when unknown. */
  weight_grams: number | null
  categories: { id: number; slug: string; name: string }[]
  tags: string[]
  /** Source URLs of every gallery image. We re-host these in S3 ourselves. */
  images: { src: string; alt: string | null }[]
  /** For variable products only. Empty list otherwise. */
  variations: LegacyVariation[]
  /** ACF / Yoast metadata flattened to a plain object. */
  meta: Record<string, string | number | boolean | null>
}

export interface LegacyVariation {
  id: number
  sku: string | null
  price: string
  weight_grams: number | null
  /** Free-form options keyed by attribute name. */
  attributes: Record<string, string>
}

export interface LegacyCustomer {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  date_created: string
  billing: LegacyAddress | null
  shipping: LegacyAddress | null
  /** Newsletter opt-in flag from the legacy mailing module, if any. */
  marketing_opt_in: boolean
}

export interface LegacyAddress {
  first_name: string | null
  last_name: string | null
  company: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  state: string | null
  postcode: string | null
  country: string | null
  phone: string | null
}

/**
 * Adapter contract for any legacy data source — live WC REST API or local
 * CSV fixtures. The scripts are written against this interface so we can
 * swap in/out without touching the migration logic.
 */
export interface MigrationReader {
  /** Identifier shown in logs / migration reports. */
  readonly name: string
  listProducts(): AsyncIterable<LegacyProduct>
  listCustomers(): AsyncIterable<LegacyCustomer>
}

/** Per-script outcome captured in `migration-report-<ts>.json`. */
export interface MigrationReportEntry {
  legacy_id: number
  /** What we did: created / updated / skipped (duplicate or invalid). */
  outcome: "created" | "updated" | "skipped" | "failed"
  /** Newly-minted Medusa id (created/updated only). */
  medusa_id?: string
  /** Skip / failure reason when relevant. */
  notes?: string
}

export interface MigrationReport {
  script: string
  source: string
  started_at: string
  finished_at: string
  dry_run: boolean
  totals: {
    seen: number
    created: number
    updated: number
    skipped: number
    failed: number
  }
  entries: MigrationReportEntry[]
}
