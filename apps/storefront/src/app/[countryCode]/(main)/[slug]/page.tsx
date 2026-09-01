import { getAuthorById } from "@lib/data/authors"
import { getLiveProductsByHandle } from "@lib/data/live-products-by-handle"
import { getAllPublishedPages, getPageBySlug } from "@lib/data/pages"
import {
  countryForLocale,
  hreflangForLocale,
  localeForCountry,
  SUPPORTED_LOCALES,
  type Locale,
} from "@lib/i18n/locale-map"
import { JsonLd } from "@lib/seo/json-ld"
import { articleSchema } from "@lib/seo/schemas/article"
import { breadcrumbSchema } from "@lib/seo/schemas/breadcrumb"
import { faqPageSchema, filterValidFaqItems } from "@lib/seo/schemas/faq"
import {
  LEHENA_WORKSHOP,
  localBusinessSchema,
} from "@lib/seo/schemas/local-business"
import {
  extractProductEmbedHandles,
  TiptapContent,
  type JSONContent,
} from "@lib/tiptap-renderer"
import { getBaseURL } from "@lib/util/env"
import ArticleByline from "@modules/common/components/article-byline"
import FaqAccordion from "@modules/common/components/faq-accordion"
import { notFound } from "next/navigation"

import { PreviewBanner } from "../../../../components/preview-banner"

import type { Metadata } from "next"

interface Params {
  countryCode: string
  slug: string
}
interface SearchParams {
  preview?: string
}

interface Props {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}

// Rendered dynamically: the page reads `searchParams.preview`, which is
// incompatible with a static `revalidate` directive (Next 15 throws
// DYNAMIC_SERVER_USAGE, 500-ing every CMS slug). The per-request cost stays
// low because the underlying SDK fetches keep their own `revalidate`+tags,
// so backend page data is still cached for an hour.
export const dynamic = "force-dynamic"

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const pages = await getAllPublishedPages()
    return pages.map((p) => ({
      countryCode: countryForLocale(p.locale as Locale),
      slug: p.slug,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const { preview } = await props.searchParams
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug(slug, { previewToken: preview, locale })

  if (!result) {
    return { title: "Page introuvable" }
  }

  const { page, translations } = result
  const title = page.meta_title ?? page.title
  const description = page.meta_description ?? page.excerpt ?? undefined
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical =
    page.canonical_override ?? `${baseUrl}/${countryCode}/${page.slug}`

  // hreflang: one entry per published translation, with x-default → FR.
  const languages: Record<string, string> = {}
  for (const t of translations) {
    const tLocale = t.locale as Locale
    if (!SUPPORTED_LOCALES.includes(tLocale)) continue
    languages[hreflangForLocale(tLocale)] = `${baseUrl}/${countryForLocale(
      tLocale
    )}/${t.slug}`
  }
  // Always include self.
  languages[hreflangForLocale(page.locale as Locale)] = canonical
  // x-default → French translation if any, else canonical.
  const frTranslation = translations.find((t) => t.locale === "fr")
  languages["x-default"] = frTranslation
    ? `${baseUrl}/fr/${frTranslation.slug}`
    : canonical

  const robots =
    page.status === "draft" || page.noindex
      ? { index: false, follow: false }
      : undefined

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: page.og_image_url
        ? [{ url: page.og_image_url, alt: page.title }]
        : undefined,
      locale: hreflangForLocale(page.locale as Locale).replace("-", "_"),
    },
    twitter: {
      card: page.og_image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: page.og_image_url ? [page.og_image_url] : undefined,
    },
    robots,
  }
}

export default async function StorefrontPage(props: Props) {
  const { countryCode, slug } = await props.params
  const { preview } = await props.searchParams
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug(slug, { previewToken: preview, locale })

  if (!result) {
    notFound()
  }

  const { page } = result

  // Hydrate product-embed nodes with live product data so the renderer can
  // show real titles, thumbs and prices instead of stale snapshots.
  const embedHandles = extractProductEmbedHandles(
    page.content as JSONContent | null
  )
  const liveProducts =
    embedHandles.length > 0
      ? await getLiveProductsByHandle(embedHandles, countryCode)
      : undefined

  const isPreview = !!preview
  const isDraft = page.status === "draft"
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical =
    page.canonical_override ?? `${baseUrl}/${countryCode}/${page.slug}`

  // Per-slug schema injection. The atelier slug gets LocalBusiness — every
  // other editorial slug rendering an article gets BlogPosting via the
  // page.type field.
  const isAtelier = page.slug === "atelier"
  const isArticle = (page.type ?? "page") !== "page"

  // Author byline (EEAT) — only for editorial types carrying an author_id.
  // The store route resolves an author by id as well as slug.
  const authorResult =
    isArticle && page.author_id
      ? await getAuthorById(page.author_id, { locale })
      : null
  const author = authorResult?.author ?? null
  const authorUrl = author
    ? `${baseUrl}/${countryCode}/auteurs/${author.slug}`
    : null

  // Real dates, clamped so dateModified is never before datePublished
  // (Google warns otherwise).
  const publishedAt =
    page.published_at ?? page.updated_at ?? new Date(0).toISOString()
  const rawModified = page.updated_at ?? publishedAt
  const dateModified =
    new Date(rawModified).getTime() >= new Date(publishedAt).getTime()
      ? rawModified
      : publishedAt

  // Visible FAQ + FAQPage schema — placeholder/empty answers are dropped so
  // the schema is only emitted when at least one real Q&A survives.
  const faqItems = filterValidFaqItems(page.faq)

  return (
    <>
      <JsonLd
        id="lehena-breadcrumb"
        schema={breadcrumbSchema([
          { name: "Accueil", url: `/${countryCode}` },
          { name: page.title },
        ])}
      />
      {isAtelier ? (
        <JsonLd
          id="lehena-localbusiness"
          schema={localBusinessSchema(LEHENA_WORKSHOP)}
        />
      ) : null}
      {isArticle ? (
        <JsonLd
          id="lehena-article"
          schema={articleSchema({
            url: canonical,
            headline: page.title,
            description: page.meta_description ?? page.excerpt ?? null,
            image: page.og_image_url ?? null,
            date_published: publishedAt,
            date_modified: dateModified,
            author:
              author && authorUrl
                ? {
                    name: author.name,
                    url: authorUrl,
                    jobTitle: author.role_title,
                    image: author.photo_url,
                    sameAs: author.social_links?.map((s) => s.url) ?? null,
                  }
                : null,
            section: page.tags?.[0] ?? null,
            keywords: page.tags ?? [],
          })}
        />
      ) : null}
      {faqItems.length > 0 ? (
        <JsonLd id="lehena-faq" schema={faqPageSchema(faqItems)} />
      ) : null}
      {isPreview && <PreviewBanner isDraft={isDraft} />}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {page.title}
          </h1>
          {author ? (
            <ArticleByline
              name={author.name}
              slug={author.slug}
              countryCode={countryCode}
              roleTitle={author.role_title}
              photoUrl={author.photo_url}
              publishedAt={page.published_at}
              updatedAt={page.updated_at}
            />
          ) : (
            page.published_at && (
              <p className="mt-3 text-sm text-ink-mute">
                Publié le{" "}
                {new Date(page.published_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )
          )}
        </header>
        <TiptapContent
          content={page.content as JSONContent | null}
          liveProducts={liveProducts}
          countryCode={countryCode}
        />
      </article>
      {faqItems.length > 0 ? <FaqAccordion items={faqItems} /> : null}
    </>
  )
}
