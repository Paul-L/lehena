import { renderSitemapIndex, SITEMAP_HEADERS } from "@lib/seo/sitemap-xml"
import { getBaseURL } from "@lib/util/env"

/**
 * Sitemap index — points the crawlers at every segmented sub-sitemap so
 * each can be fetched and parsed independently. Submitted to Google
 * Search Console as the single entry point.
 */
export async function GET() {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const lastmod = new Date().toISOString()
  const sitemaps = [
    { loc: `${baseUrl}/sitemap-pages.xml`, lastmod },
    { loc: `${baseUrl}/sitemap-articles.xml`, lastmod },
    { loc: `${baseUrl}/sitemap-products.xml`, lastmod },
    { loc: `${baseUrl}/sitemap-categories.xml`, lastmod },
  ]
  return new Response(renderSitemapIndex(sitemaps), {
    headers: SITEMAP_HEADERS,
  })
}
