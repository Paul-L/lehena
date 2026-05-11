import { getAllPublishedPages, type PageSummary } from "@lib/data/pages"
import {
  countryForLocale,
  hreflangForLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from "@lib/i18n/locale-map"
import { getBaseURL } from "@lib/util/env"

import type { MetadataRoute } from "next"

/**
 * App Router native sitemap — exposed at `/sitemap.xml`.
 *
 * Enumerates the editorial pages module (`/{countryCode}/{slug}`) and emits
 * one entry per (translation_group, locale) pair, with the language alternates
 * cross-linked via `alternates.languages` (rendered as `xhtml:link`).
 *
 * Pages marked `noindex` are excluded. If the backend is unreachable at
 * request time, the function returns an empty list so the route still
 * responds 200 with a valid (empty) sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  let pages: PageSummary[] = []
  try {
    pages = await getAllPublishedPages()
  } catch {
    return []
  }

  // Drop noindex pages outright.
  pages = pages.filter((p) => !p.noindex)

  // Group by translation_group_id so we can cross-link alternates. Pages
  // without a group get a synthetic group keyed by id (so they render alone).
  const groups = new Map<string, PageSummary[]>()
  for (const p of pages) {
    const key = p.translation_group_id ?? `solo-${p.id}`
    const arr = groups.get(key) ?? []
    arr.push(p)
    groups.set(key, arr)
  }

  const entries: MetadataRoute.Sitemap = []
  groups.forEach((siblings) => {
    // Build the language→URL map shared by every sibling in the group.
    const languages: Record<string, string> = {}
    for (const s of siblings) {
      const lc = s.locale as Locale
      if (!SUPPORTED_LOCALES.includes(lc)) continue
      languages[hreflangForLocale(lc)] = `${baseUrl}/${countryForLocale(
        lc
      )}/${s.slug}`
    }
    const frSibling = siblings.find((s: PageSummary) => s.locale === "fr")
    languages["x-default"] = frSibling
      ? `${baseUrl}/fr/${frSibling.slug}`
      : Object.values(languages)[0]

    for (const p of siblings) {
      const lc = p.locale as Locale
      if (!SUPPORTED_LOCALES.includes(lc)) continue
      entries.push({
        url: `${baseUrl}/${countryForLocale(lc)}/${p.slug}`,
        lastModified: p.published_at ? new Date(p.published_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages },
      })
    }
  })

  return entries
}
