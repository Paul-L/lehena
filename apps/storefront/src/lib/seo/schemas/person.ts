/**
 * Schema.org Person — used to credit blog article / recipe authors.
 * Lives in the Lehena CMS as an `author` row (Phase 9 module).
 */
export interface PersonSchemaInput {
  name: string
  /** Canonical URL of the author's bio page on the site. */
  url: string
  /** Profile photo if available. */
  image?: string | null
  /** One-line bio. */
  description?: string | null
  /** Professional title, e.g. "Maître Artisan Charcutier". */
  jobTitle?: string | null
  /** External social profile URLs (Instagram, LinkedIn, etc.). */
  sameAs?: string[]
}

export function personSchema(input: PersonSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    image: input.image ?? undefined,
    description: input.description ?? undefined,
    jobTitle: input.jobTitle ?? undefined,
    sameAs: input.sameAs && input.sameAs.length > 0 ? input.sameAs : undefined,
  }
}
