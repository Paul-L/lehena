/**
 * Schema.org Article / BlogPosting for editorial content. Maps to the
 * Lehena CMS Page entity when `type === "article"` (Phase 9 extension).
 */
export interface ArticleSchemaInput {
  /** Article URL, canonical. */
  url: string
  headline: string
  description?: string | null
  image?: string | null
  date_published: string
  date_modified?: string | null
  author?: {
    name: string
    url: string
  } | null
  /** Optional pillar / category tag for breadcrumb context. */
  section?: string | null
  /** Free-form keywords — kept short, comma-separated by schema convention. */
  keywords?: string[]
}

const PUBLISHER = {
  "@type": "Organization",
  name: "Maison Lehena",
  logo: {
    "@type": "ImageObject",
    url: "https://lehena.fr/logo.png",
  },
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    headline: input.headline.slice(0, 110),
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    datePublished: input.date_published,
    dateModified: input.date_modified ?? input.date_published,
    author: input.author
      ? {
          "@type": "Person",
          name: input.author.name,
          url: input.author.url,
        }
      : undefined,
    publisher: PUBLISHER,
    articleSection: input.section ?? undefined,
    keywords:
      input.keywords && input.keywords.length > 0
        ? input.keywords.join(", ")
        : undefined,
  }
}
