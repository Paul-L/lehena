import { getBaseURL } from "@lib/util/env"

import { SITE_NAME } from "../metadata"

/**
 * Schema.org WebSite for the storefront, including a SearchAction so Google
 * can render a search box for the brand directly in SERP results.
 */
export function websiteSchema() {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: SITE_NAME,
    inLanguage: "fr-FR",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/fr/store?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}
