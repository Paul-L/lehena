/**
 * Helpers to emit sitemap XML by hand. We hand-roll the XML rather than
 * lean on Next's `MetadataRoute.Sitemap` because:
 *  - Next's helper only emits the `<urlset>` form, never `<sitemapindex>`
 *  - We want `<xhtml:link rel="alternate" hreflang="…">` per URL, which
 *    requires escaping that's easier to control directly.
 *
 * All helpers return strings; the route handlers wrap them with the right
 * `application/xml` headers.
 */

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'

export interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never"
  priority?: number
  /** hreflang → URL. Optional. */
  alternates?: Record<string, string>
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const items = entries
    .map((e) => {
      const alts = e.alternates
        ? Object.entries(e.alternates)
            .map(
              ([lang, url]) =>
                `<xhtml:link rel="alternate" hreflang="${escapeXml(
                  lang
                )}" href="${escapeXml(url)}" />`
            )
            .join("")
        : ""
      return [
        "<url>",
        `<loc>${escapeXml(e.loc)}</loc>`,
        e.lastmod ? `<lastmod>${escapeXml(e.lastmod)}</lastmod>` : "",
        e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : "",
        typeof e.priority === "number"
          ? `<priority>${e.priority.toFixed(1)}</priority>`
          : "",
        alts,
        "</url>",
      ]
        .filter(Boolean)
        .join("")
    })
    .join("\n  ")
  return [
    XML_HEADER,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    items,
    "</urlset>",
  ].join("\n")
}

export function renderSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[]
): string {
  const items = sitemaps
    .map((s) =>
      [
        "<sitemap>",
        `<loc>${escapeXml(s.loc)}</loc>`,
        s.lastmod ? `<lastmod>${escapeXml(s.lastmod)}</lastmod>` : "",
        "</sitemap>",
      ]
        .filter(Boolean)
        .join("")
    )
    .join("\n  ")
  return [
    XML_HEADER,
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    items,
    "</sitemapindex>",
  ].join("\n")
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
}
