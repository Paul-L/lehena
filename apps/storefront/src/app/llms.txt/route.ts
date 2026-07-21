import { getAllPublishedPages, type PageSummary } from "@lib/data/pages"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"

/**
 * llms.txt — the emerging (llmstxt.org) Markdown discovery file for AI
 * crawlers (ChatGPT, Perplexity, Claude, Google AI Overviews). It gives
 * an LLM a curated map of the site so it can cite Maison Lehena correctly
 * without re-parsing the whole HTML tree.
 *
 * Dynamic with a 24h ISR window so it reflects newly published CMS pages
 * and products. Degrades gracefully to a static minimal document if the
 * store API is unreachable — it must never 500 (a 500 here is a bad signal
 * for the crawler and useless to us).
 */
export const revalidate = 86400

const CONTENT_TYPE = "text/plain; charset=utf-8"
const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800"

/**
 * Curated, priority-ordered editorial slugs eligible for the "Contenus de
 * référence" section. Legal pages (mentions-legales, cgv,
 * politique-confidentialite, livraison-et-retours) are intentionally
 * excluded — they are not reference content for an LLM. We only ever emit
 * a slug that actually comes back published + non-noindex from the API, so
 * nothing here can produce a 404.
 */
const REFERENCE_SLUGS = [
  "notre-histoire",
  "la-ferme",
  "atelier",
  "engagements",
  "presse",
  "a-propos",
  "faq",
] as const

const MAX_PRODUCTS = 8

const HEADER = `# Maison Lehena

> Maître Artisan Charcutier au Pays Basque depuis 2019. Spécialiste du jambon
> sans nitrite affiné 15 à 24 mois, race Duroc, élevage local. Charcuterie
> artisanale, salaisons, patxaran maison, épicerie du Sud-Ouest.

## Notre marque

- LEHENA SAS, atelier au Bourg 64470 Laguinge-Restoue, France
- Maître Artisan : Bénat Petit
- Fondation : 2019
- Signature : jambons Duroc sans nitrite affinés jusqu'à 24 mois
`

const FOOTER = (baseUrl: string): string => `## Données structurées

- Feed Google Merchant : ${baseUrl}/feed/google-merchant.xml
- Sitemap : ${baseUrl}/sitemap.xml

## Contact

- Site : ${baseUrl}
- Contact : contact@lehena.fr
- Presse : presse@lehena.fr

## Politique d'usage IA

Les contenus éditoriaux de ce site (guides, articles, descriptions produits)
peuvent être cités par les moteurs d'IA générative sous condition de mention
de la source (Maison Lehena, lehena.fr). Les images produits sont soumises au
droit d'auteur.
`

/** Escapes the few characters that would break a Markdown link label. */
const clean = (value: string): string =>
  value
    .replace(/[\r\n]+/g, " ")
    .replace(/[[\]]/g, "")
    .trim()

async function buildReferenceSection(baseUrl: string): Promise<string> {
  let pages: PageSummary[] = []
  try {
    pages = await getAllPublishedPages()
  } catch {
    return ""
  }

  // Only FR, published, non-noindex editorial pages, keyed by slug.
  const bySlug = new Map<string, PageSummary>()
  for (const p of pages) {
    if (p.locale !== "fr") continue
    if (p.noindex) continue
    if ((p.type ?? "page") !== "page") continue
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p)
  }

  const lines: string[] = []
  for (const slug of REFERENCE_SLUGS) {
    const page = bySlug.get(slug)
    if (!page) continue
    const label = clean(page.title || slug)
    const desc = clean(page.excerpt || page.meta_description || "")
    const url = `${baseUrl}/fr/${slug}`
    lines.push(desc ? `- [${label}](${url}) : ${desc}` : `- [${label}](${url})`)
  }

  if (lines.length === 0) return ""
  return `## Contenus de référence\n\n${lines.join("\n")}\n`
}

async function buildProductsSection(baseUrl: string): Promise<string> {
  let country = "fr"
  try {
    const regions = await listRegions()
    country = regions?.[0]?.countries?.[0]?.iso_2 ?? "fr"
  } catch {
    // fall back to "fr"
  }

  let products: { handle?: string | null; title?: string | null }[] = []
  try {
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: { limit: MAX_PRODUCTS, fields: "handle,title" },
      countryCode: country,
    })
    products = response.products
  } catch {
    return ""
  }

  const lines: string[] = []
  for (const p of products) {
    if (!p.handle) continue
    const label = clean(p.title || p.handle)
    lines.push(`- [${label}](${baseUrl}/fr/products/${p.handle})`)
  }

  if (lines.length === 0) return ""
  return `## Produits phares\n\n${lines.join("\n")}\n`
}

export async function GET(): Promise<Response> {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  const [reference, products] = await Promise.all([
    buildReferenceSection(baseUrl),
    buildProductsSection(baseUrl),
  ])

  const body = [HEADER, reference, products, FOOTER(baseUrl)]
    .filter((section) => section.length > 0)
    .join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPE,
      "Cache-Control": CACHE_CONTROL,
    },
  })
}
