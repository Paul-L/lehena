import type { MetadataRoute } from "next"
import { getAllPublishedPages } from "@lib/data/pages"
import { getBaseURL } from "@lib/util/env"

/**
 * App Router native sitemap — exposed at `/sitemap.xml`.
 *
 * Currently only enumerates the editorial pages module (`/{locale}/{slug}`).
 * The legacy `next-sitemap.js` (postbuild) is still configured for the rest
 * of the storefront — Next.js's native sitemap is used for the routes it
 * knows how to enumerate at runtime, the postbuild script for the static
 * scan of the route tree.
 *
 * If the backend is unreachable at request time, the function returns an
 * empty list so the route still responds 200 with a valid (empty) sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  let pages: Awaited<ReturnType<typeof getAllPublishedPages>> = []
  try {
    pages = await getAllPublishedPages()
  } catch {
    return []
  }

  return pages.map((p) => ({
    url: `${baseUrl}/${p.locale}/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))
}
