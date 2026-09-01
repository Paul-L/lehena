import {
  getProductDetails,
  type EnrichedProduct,
} from "@lib/data/product-details"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { buildMerchantFeed } from "@lib/seo/merchant-feed"
import { getBaseURL } from "@lib/util/env"

/**
 * Google Merchant Center feed for the whole published catalog, scoped to the
 * FR region (mono-currency EUR). Merchant Center fetches this on a schedule;
 * ISR keeps it cheap (revalidate hourly) and the Cache-Control header lets
 * Traefik / the CDN serve it without hitting Next between revalidations.
 */
export const revalidate = 3600

const LOCALE = "fr"
const PAGE_SIZE = 100
const ENRICH_CONCURRENCY = 8

const FEED_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
}

/** Fetch every published product handle for the FR region, paginating. */
async function listAllHandles(countryCode: string): Promise<string[]> {
  const handles: string[] = []
  let page = 1
  // Hard stop well above the catalog size to avoid an infinite loop if the
  // API ever reports a bogus count.
  const MAX_PAGES = 250
  while (page <= MAX_PAGES) {
    const { response } = await listProducts({
      pageParam: page,
      queryParams: {
        limit: PAGE_SIZE,
        fields: "handle",
      },
      countryCode,
    })
    const batch = response.products ?? []
    if (!batch.length) break
    for (const p of batch) {
      if (p.handle) handles.push(p.handle)
    }
    if (batch.length < PAGE_SIZE) break
    page++
  }
  return handles
}

/** Resolve full PDP payloads for a list of handles with bounded concurrency. */
async function enrichAll(
  handles: string[],
  countryCode: string
): Promise<EnrichedProduct[]> {
  const products: EnrichedProduct[] = []
  for (let i = 0; i < handles.length; i += ENRICH_CONCURRENCY) {
    const slice = handles.slice(i, i + ENRICH_CONCURRENCY)
    const resolved = await Promise.all(
      slice.map((handle) => getProductDetails(handle, countryCode))
    )
    for (const product of resolved) {
      if (product) products.push(product)
    }
  }
  return products
}

export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  try {
    // The FR region gives us EUR pricing. Fall back to the first region's
    // first country if FR is not configured for some reason.
    const regions = await listRegions()
    const frCountry = regions
      ?.flatMap((r) => r.countries ?? [])
      .find((c) => c?.iso_2 === LOCALE)
    const countryCode =
      frCountry?.iso_2 ?? regions?.[0]?.countries?.[0]?.iso_2 ?? LOCALE

    const handles = await listAllHandles(countryCode)
    const products = await enrichAll(handles, countryCode)

    const xml = buildMerchantFeed(products, { baseUrl, locale: LOCALE })
    return new Response(xml, { headers: FEED_HEADERS })
  } catch {
    // Never 500 the crawler — return a valid (empty) feed on failure.
    const xml = buildMerchantFeed([], { baseUrl, locale: LOCALE })
    return new Response(xml, { headers: FEED_HEADERS })
  }
}
