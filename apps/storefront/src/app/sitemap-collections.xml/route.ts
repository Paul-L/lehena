import { listCollections } from "@lib/data/collections"
import { countryForLocale, type Locale } from "@lib/i18n/locale-map"
import {
  renderUrlset,
  SITEMAP_HEADERS,
  type SitemapEntry,
} from "@lib/seo/sitemap-xml"
import { getBaseURL } from "@lib/util/env"

/**
 * Collection pages (`/[countryCode]/collections/[handle]`). Mirrors the
 * categories sitemap: FR canonical loc + per-locale hreflang alternates.
 */
export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  let collections: { handle?: string; updated_at?: string }[] = []
  try {
    const res = await listCollections({ limit: "100" })
    collections = res.collections ?? []
  } catch {
    return new Response(renderUrlset([]), { headers: SITEMAP_HEADERS })
  }

  const locales: Locale[] = ["fr", "es", "en"]
  const entries: SitemapEntry[] = []
  for (const c of collections) {
    if (!c.handle) continue
    const languages: Record<string, string> = {}
    for (const lc of locales) {
      languages[hreflangFor(lc)] = `${baseUrl}/${countryForLocale(
        lc
      )}/collections/${c.handle}`
    }
    languages["x-default"] = `${baseUrl}/fr/collections/${c.handle}`
    entries.push({
      loc: `${baseUrl}/fr/collections/${c.handle}`,
      lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : undefined,
      changefreq: "weekly",
      priority: 0.6,
      alternates: languages,
    })
  }
  return new Response(renderUrlset(entries), { headers: SITEMAP_HEADERS })
}

function hreflangFor(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-GB"
}
