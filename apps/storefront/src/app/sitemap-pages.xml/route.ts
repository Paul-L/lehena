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
 * Editorial pages only (type=page). Articles ship in their own sitemap so
 * news / blog content can be crawled with a higher cadence without
 * dragging the rest along.
 */
export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  let pages: PageSummary[] = []
  try {
    pages = await getAllPublishedPages()
  } catch {
    return new Response(renderUrlset([]), { headers: SITEMAP_HEADERS })
  }
  pages = pages.filter((p) => !p.noindex && (p.type ?? "page") === "page")

  const groups = new Map<string, PageSummary[]>()
  for (const p of pages) {
    const key = p.translation_group_id ?? `solo-${p.id}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const entries: SitemapEntry[] = []

  // Hardcoded file-route landing/commercial pages (not CMS entries, so they
  // never appear in getAllPublishedPages). FR-first; served at /fr/<path>.
  const STATIC_ROUTES: {
    path: string
    changefreq: SitemapEntry["changefreq"]
    priority: number
  }[] = [
    { path: "", changefreq: "weekly", priority: 1.0 },
    { path: "/store", changefreq: "daily", priority: 0.9 },
    { path: "/la-ferme", changefreq: "monthly", priority: 0.8 },
    { path: "/abonnements", changefreq: "monthly", priority: 0.7 },
    { path: "/contact", changefreq: "yearly", priority: 0.5 },
  ]
  for (const r of STATIC_ROUTES) {
    entries.push({
      loc: `${baseUrl}/fr${r.path}`,
      changefreq: r.changefreq,
      priority: r.priority,
    })
  }

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
        changefreq: "monthly",
        priority: 0.7,
        alternates: languages,
      })
    }
  })

  return new Response(renderUrlset(entries), { headers: SITEMAP_HEADERS })
}
