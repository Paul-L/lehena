export interface FaqSchemaItem {
  question: string
  answer: string
}

/**
 * Matches unwritten / placeholder answers so they are never rendered nor
 * emitted into the FAQPage schema (Google flags placeholder FAQ, cf. SEO 06).
 */
const PLACEHOLDER_RE = /à rédiger|à valider|à compléter|à remplir|lorem ipsum/i

/**
 * Keeps only FAQ items with a real question AND a real answer — drops empty
 * or placeholder ("À rédiger…") entries. Use before rendering the accordion
 * and before emitting the schema so both stay in sync.
 */
export function filterValidFaqItems<T extends FaqSchemaItem>(
  items: readonly T[] | null | undefined
): T[] {
  if (!items) return []
  return items.filter((it) => {
    const q = (it.question ?? "").trim()
    const a = (it.answer ?? "").trim()
    if (q.length === 0 || a.length === 0) return false
    if (PLACEHOLDER_RE.test(q) || PLACEHOLDER_RE.test(a)) return false
    return true
  })
}

/** Schema.org FAQPage. Inject on PDP when the product has FAQ items. */
export function faqPageSchema(items: FaqSchemaItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.answer,
      },
    })),
  }
}
