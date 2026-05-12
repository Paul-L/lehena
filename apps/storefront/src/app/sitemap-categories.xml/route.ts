import { listCategories } from "@lib/data/categories"
import { countryForLocale, type Locale } from "@lib/i18n/locale-map"
import {
  renderUrlset,
  SITEMAP_HEADERS,
  type SitemapEntry,
} from "@lib/seo/sitemap-xml"
import { getBaseURL } from "@lib/util/env"

export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  let categories: { handle?: string; updated_at?: string }[] = []
  try {
    categories = await listCategories({ limit: 500 })
  } catch {
    return new Response(renderUrlset([]), { headers: SITEMAP_HEADERS })
  }

  const locales: Locale[] = ["fr", "es", "en"]
  const entries: SitemapEntry[] = []
  for (const c of categories) {
    if (!c.handle) continue
    const languages: Record<string, string> = {}
    for (const lc of locales) {
      languages[hreflangFor(lc)] = `${baseUrl}/${countryForLocale(
        lc
      )}/categories/${c.handle}`
    }
    languages["x-default"] = `${baseUrl}/fr/categories/${c.handle}`
    entries.push({
      loc: `${baseUrl}/fr/categories/${c.handle}`,
      lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : undefined,
      changefreq: "weekly",
      priority: 0.7,
      alternates: languages,
    })
  }
  return new Response(renderUrlset(entries), { headers: SITEMAP_HEADERS })
}

function hreflangFor(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" : "en-GB"
}
