import { getBaseURL } from "@lib/util/env"

export interface BreadcrumbSchemaItem {
  name: string
  /** Absolute or root-relative URL. Will be made absolute against the base. */
  url?: string
}

/**
 * Schema.org BreadcrumbList. The last item should NOT include a URL (Google
 * recommends omitting the link on the current page).
 */
export function breadcrumbSchema(items: BreadcrumbSchemaItem[]) {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: idx + 1,
        name: it.name,
      }
      if (it.url) {
        entry.item = it.url.startsWith("http")
          ? it.url
          : `${baseUrl}${it.url.startsWith("/") ? "" : "/"}${it.url}`
      }
      return entry
    }),
  }
}
