import type {
  LegacyCustomer,
  LegacyProduct,
  LegacyVariation,
  MigrationReader,
} from "../types"

/**
 * WooCommerce REST API v3 reader. Activated when `WC_API_URL` +
 * `WC_API_CONSUMER_KEY` + `WC_API_CONSUMER_SECRET` are set in env.
 *
 * Uses Basic auth (consumer key / secret) and respects the per_page=100
 * cap of WC. Paginates until the `X-WP-TotalPages` header is exhausted.
 * No retry / backoff in V1 — the migration is a one-shot operator
 * action; if WC throws a 5xx the operator re-runs (the migration is
 * idempotent via `metadata.migrated_from`).
 */
export class WooCommerceApiReader implements MigrationReader {
  readonly name = "woocommerce-api"
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(config: {
    baseUrl: string
    consumerKey: string
    consumerSecret: string
  }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "")
    const token = Buffer.from(
      `${config.consumerKey}:${config.consumerSecret}`
    ).toString("base64")
    this.authHeader = `Basic ${token}`
  }

  static fromEnv(): WooCommerceApiReader | null {
    const baseUrl = process.env.WC_API_URL
    const consumerKey = process.env.WC_API_CONSUMER_KEY
    const consumerSecret = process.env.WC_API_CONSUMER_SECRET
    if (!baseUrl || !consumerKey || !consumerSecret) return null
    return new WooCommerceApiReader({ baseUrl, consumerKey, consumerSecret })
  }

  async *listProducts(): AsyncIterable<LegacyProduct> {
    for await (const product of this.paginate<WcProductDto>(
      "/wp-json/wc/v3/products",
      { per_page: "100", status: "any" }
    )) {
      const variations: LegacyVariation[] =
        product.type === "variable" && product.variations.length > 0
          ? await this.fetchVariations(product.id)
          : []
      yield {
        id: product.id,
        slug: product.slug,
        name: product.name,
        type: product.type,
        status: product.status,
        description: product.description ?? null,
        short_description: product.short_description ?? null,
        price: product.price || null,
        sku: product.sku || null,
        weight_grams: parseWeightToGrams(product.weight),
        categories: (product.categories ?? []).map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
        })),
        tags: (product.tags ?? []).map((t) => t.name),
        images: (product.images ?? []).map((i) => ({
          src: i.src,
          alt: i.alt || null,
        })),
        variations,
        meta: flattenMeta(product.meta_data ?? []),
      }
    }
  }

  async *listCustomers(): AsyncIterable<LegacyCustomer> {
    for await (const customer of this.paginate<WcCustomerDto>(
      "/wp-json/wc/v3/customers",
      { per_page: "100", role: "all" }
    )) {
      if (!customer.email) continue
      yield {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name || null,
        last_name: customer.last_name || null,
        phone: customer.billing?.phone || null,
        date_created: customer.date_created,
        billing: addressFromDto(customer.billing ?? null),
        shipping: addressFromDto(customer.shipping ?? null),
        marketing_opt_in: false,
      }
    }
  }

  private async fetchVariations(productId: number): Promise<LegacyVariation[]> {
    const out: LegacyVariation[] = []
    for await (const v of this.paginate<WcVariationDto>(
      `/wp-json/wc/v3/products/${productId}/variations`,
      { per_page: "100" }
    )) {
      const attrs: Record<string, string> = {}
      for (const a of v.attributes ?? []) attrs[a.name] = a.option
      out.push({
        id: v.id,
        sku: v.sku || null,
        price: v.price ?? "",
        weight_grams: parseWeightToGrams(v.weight),
        attributes: attrs,
      })
    }
    return out
  }

  private async *paginate<T>(
    path: string,
    query: Record<string, string>
  ): AsyncIterable<T> {
    let page = 1
    while (true) {
      const url = new URL(`${this.baseUrl}${path}`)
      for (const [k, v] of Object.entries({ ...query, page: String(page) })) {
        url.searchParams.set(k, v)
      }
      const res = await fetch(url, {
        headers: { Authorization: this.authHeader },
      })
      if (!res.ok) {
        throw new Error(
          `[wc-reader] ${res.status} ${res.statusText} on ${url.toString()}`
        )
      }
      const body = (await res.json()) as T[]
      for (const item of body) yield item
      const totalPages = Number(res.headers.get("x-wp-totalpages") ?? "1")
      if (page >= totalPages || body.length === 0) return
      page++
    }
  }
}

function parseWeightToGrams(raw: string | null | undefined): number | null {
  if (!raw) return null
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return null
  // WC weight unit is configurable; we assume kg (the WC default for FR shops).
  return Math.round(n * 1000)
}

function flattenMeta(
  metaData: { key: string; value: unknown }[]
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {}
  for (const m of metaData) {
    if (!m.key) continue
    if (
      typeof m.value === "string" ||
      typeof m.value === "number" ||
      typeof m.value === "boolean" ||
      m.value === null
    ) {
      out[m.key] = m.value
    }
  }
  return out
}

function addressFromDto(
  raw: {
    first_name?: string
    last_name?: string
    company?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    phone?: string
  } | null
) {
  if (!raw) return null
  return {
    first_name: raw.first_name || null,
    last_name: raw.last_name || null,
    company: raw.company || null,
    address_1: raw.address_1 || null,
    address_2: raw.address_2 || null,
    city: raw.city || null,
    state: raw.state || null,
    postcode: raw.postcode || null,
    country: raw.country || null,
    phone: raw.phone || null,
  }
}

interface WcProductDto {
  id: number
  slug: string
  name: string
  type: "simple" | "variable" | "grouped" | "external"
  status: "publish" | "draft" | "pending" | "private"
  description?: string
  short_description?: string
  price?: string
  sku?: string
  weight?: string
  categories?: { id: number; slug: string; name: string }[]
  tags?: { id: number; slug: string; name: string }[]
  images?: { src: string; alt?: string }[]
  variations: number[]
  meta_data?: { key: string; value: unknown }[]
}

interface WcVariationDto {
  id: number
  sku?: string
  price?: string
  weight?: string
  attributes?: { name: string; option: string }[]
}

interface WcCustomerDto {
  id: number
  email: string
  first_name?: string
  last_name?: string
  date_created: string
  billing?: {
    first_name?: string
    last_name?: string
    company?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    phone?: string
  }
  shipping?: WcCustomerDto["billing"]
}
