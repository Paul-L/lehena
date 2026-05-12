import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { countryForLocale, type Locale } from "@lib/i18n/locale-map"
import {
  renderUrlset,
  SITEMAP_HEADERS,
  type SitemapEntry,
} from "@lib/seo/sitemap-xml"
import { getBaseURL } from "@lib/util/env"

/**
 * Every published product, scoped to the FR region by default. Higher
 * priority than pages because product URLs drive conversion. We do not
 * fan out to every region because the catalog is identical across regions
 * — the URL only differs by countryCode prefix, which Google handles via
 * hreflang at the page level (we re-emit alternates here for FR/ES/EN).
 */
export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  const products: {
    handle?: string | null
    updated_at?: string | null
  }[] = []
  try {
    // We need ONE region to list products; use the first published one.
    const regions = await listRegions()
    const region = regions?.[0]
    const country = region?.countries?.[0]?.iso_2 ?? "fr"
    let page = 1
    const limit = 100
    while (true) {
      const { response } = await listProducts({
        pageParam: page,
        queryParams: {
          limit,
          fields: "handle,updated_at",
        },
        countryCode: country,
      })
      if (!response.products?.length) break
      products.push(...response.products)
      if (response.products.length < limit) break
      page++
    }
  } catch {
    return new Response(renderUrlset([]), { headers: SITEMAP_HEADERS })
  }

  const locales: Locale[] = ["fr", "es", "en"]
  const entries: SitemapEntry[] = []
  for (const p of products) {
    if (!p.handle) continue
    // Emit per-locale URLs with hreflang cross-links. We're conservative
    // and only list the FR variant as `loc` for the primary sitemap entry
    // — duplicate `<url>` rows for each locale would bloat the file 3x
    // and Google handles hreflang fine from a single entry.
    const languages: Record<string, string> = {}
    for (const lc of locales) {
      languages[hreflangFor(lc)] = `${baseUrl}/${countryForLocale(
        lc
      )}/products/${p.handle}`
    }
    languages["x-default"] = `${baseUrl}/fr/products/${p.handle}`
    entries.push({
      loc: `${baseUrl}/fr/products/${p.handle}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
      changefreq: "weekly",
      priority: 0.8,
      alternates: languages,
    })
  }
  return new Response(renderUrlset(entries), { headers: SITEMAP_HEADERS })
}

function hreflangFor(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-GB"
}
