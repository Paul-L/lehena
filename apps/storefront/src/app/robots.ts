import { getBaseURL } from "@lib/util/env"

import type { MetadataRoute } from "next"

/**
 * Robots policy. Keep this minimal — we surface every editorial /
 * commercial URL via the sitemap index, and disallow the routes that
 * either leak PII (account, checkout) or are useless to crawlers
 * (API relay routes, the preview banner endpoint).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  return {
    rules: [
      {
        userAgent: "*",
        // Explicitly allow the Merchant feed so it is never caught by a
        // future query-param / path disallow — the Merchant crawler must
        // always be able to fetch it.
        allow: ["/", "/feed/"],
        disallow: [
          "/api/",
          "/*/account/",
          "/*/account/*",
          "/*/checkout",
          "/*/cart",
          "/*/preferences",
          "/*/recherche",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
