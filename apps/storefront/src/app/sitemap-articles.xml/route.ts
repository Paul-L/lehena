import { getAllPublishedPages, type PageSummary } from "@lib/data/pages"
import {
  countryForLocale,
  hreflangForLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@lib/i18n/locale-map"
import {
  renderUrlset,
  SITEMAP_HEADERS,
  type SitemapEntry,
} from "@lib/seo/sitemap-xml"
import { getBaseURL } from "@lib/util/env"

/**
 * Editorial articles + recipes (type=article|recipe|news). Higher crawl
 * cadence than pages, so we expose them on their own sitemap.
 */
export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  let pages: PageSummary[] = []
  try {
    pages = await getAllPublishedPages()
  } catch {
    return new Response(renderUrlset([]), { headers: SITEMAP_HEADERS })
  }
  const editorialTypes = new Set(["article", "recipe", "news"])
  pages = pages.filter(
    (p) => !p.noindex && editorialTypes.has(p.type ?? "page")
  )

  const groups = new Map<string, PageSummary[]>()
  for (const p of pages) {
    const key = p.translation_group_id ?? `solo-${p.id}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const entries: SitemapEntry[] = []
  groups.forEach((siblings) => {
    const languages: Record<string, string> = {}
    for (const s of siblings) {
      const lc = s.locale as Locale
      if (!SUPPORTED_LOCALES.includes(lc)) continue
      languages[hreflangForLocale(lc)] = `${baseUrl}/${countryForLocale(
        lc
      )}/${s.slug}`
    }
    const fr = siblings.find((s: PageSummary) => s.locale === "fr")
    languages["x-default"] = fr
      ? `${baseUrl}/fr/${fr.slug}`
      : Object.values(languages)[0]

    for (const p of siblings) {
      const lc = p.locale as Locale
      if (!SUPPORTED_LOCALES.includes(lc)) continue
      entries.push({
        loc: `${baseUrl}/${countryForLocale(lc)}/${p.slug}`,
        lastmod: p.published_at
          ? new Date(p.published_at).toISOString()
          : undefined,
        changefreq: "weekly",
        priority: 0.6,
        alternates: languages,
      })
    }
  })

  return new Response(renderUrlset(entries), { headers: SITEMAP_HEADERS })
}
