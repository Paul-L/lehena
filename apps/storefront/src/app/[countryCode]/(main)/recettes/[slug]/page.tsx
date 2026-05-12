import { getLiveProductsByHandle } from "@lib/data/live-products-by-handle"
import { getPageBySlug } from "@lib/data/pages"
import { localeForCountry } from "@lib/i18n/locale-map"
import { JsonLd } from "@lib/seo/json-ld"
import { recipeSchema } from "@lib/seo/schemas/recipe"
import {
  extractProductEmbedHandles,
  TiptapContent,
  type JSONContent,
} from "@lib/tiptap-renderer"
import { getBaseURL } from "@lib/util/env"
import { notFound } from "next/navigation"

import type { Metadata } from "next"

interface Params {
  countryCode: string
  slug: string
}
interface Props {
  params: Promise<Params>
}

interface RecipeMeta {
  prep_time?: string | null
  cook_time?: string | null
  total_time?: string | null
  recipe_yield?: string | null
  recipe_category?: string | null
  ingredients?: string[]
  steps?: string[]
}

export const revalidate = 3600

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug(slug, { locale })
  if (!result) return { title: "Recette introuvable" }
  const { page } = result
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical =
    page.canonical_override ?? `${baseUrl}/${countryCode}/recettes/${page.slug}`
  return {
    title: page.meta_title ?? page.title,
    description: page.meta_description ?? page.excerpt ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: page.meta_title ?? page.title,
      description: page.meta_description ?? page.excerpt ?? undefined,
      url: canonical,
      type: "article",
      images: page.og_image_url
        ? [{ url: page.og_image_url, alt: page.title }]
        : undefined,
    },
    robots: page.noindex ? { index: false, follow: false } : undefined,
  }
}

/**
 * Dedicated route for `type=recipe` pages. We still hit the same /store/pages
 * endpoint as the regular [slug] catch-all, but reject pages that aren't
 * marked as recipes so the URL space stays predictable for Google.
 */
export default async function RecipePage(props: Props) {
  const { countryCode, slug } = await props.params
  const locale = localeForCountry(countryCode)
  const result = await getPageBySlug(slug, { locale })
  if (!result) notFound()
  const { page } = result
  if ((page.type ?? "page") !== "recipe") notFound()

  const embedHandles = extractProductEmbedHandles(
    page.content as JSONContent | null
  )
  const liveProducts =
    embedHandles.length > 0
      ? await getLiveProductsByHandle(embedHandles, countryCode)
      : undefined

  const baseUrl = getBaseURL().replace(/\/$/, "")
  const canonical = `${baseUrl}/${countryCode}/recettes/${page.slug}`

  // Structured recipe fields live on `page.content`'s tiptap doc or in
  // a future page.recipe_meta column — for V1 we accept an optional
  // `metadata.recipe` JSON blob on the page (set in admin via the
  // settings panel) and fall back to the bare schema if absent.
  const recipeMeta = (page as unknown as { metadata?: { recipe?: RecipeMeta } })
    .metadata?.recipe

  return (
    <>
      <JsonLd
        id="lehena-recipe"
        schema={recipeSchema({
          url: canonical,
          name: page.title,
          description: page.meta_description ?? page.excerpt ?? null,
          image: page.og_image_url ?? null,
          date_published: page.published_at ?? null,
          prep_time: recipeMeta?.prep_time ?? null,
          cook_time: recipeMeta?.cook_time ?? null,
          total_time: recipeMeta?.total_time ?? null,
          recipe_yield: recipeMeta?.recipe_yield ?? null,
          recipe_category: recipeMeta?.recipe_category ?? null,
          ingredients: recipeMeta?.ingredients,
          steps: recipeMeta?.steps,
        })}
      />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "var(--ink-mute)",
              marginBottom: 8,
            }}
          >
            RECETTE
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {page.title}
          </h1>
          {recipeMeta?.prep_time ||
          recipeMeta?.cook_time ||
          recipeMeta?.recipe_yield ? (
            <div
              className="mono"
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "var(--ink-mute)",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {recipeMeta.prep_time ? (
                <span>Préparation : {recipeMeta.prep_time}</span>
              ) : null}
              {recipeMeta.cook_time ? (
                <span>Cuisson : {recipeMeta.cook_time}</span>
              ) : null}
              {recipeMeta.recipe_yield ? (
                <span>Pour {recipeMeta.recipe_yield}</span>
              ) : null}
            </div>
          ) : null}
        </header>
        <TiptapContent
          content={page.content as JSONContent | null}
          liveProducts={liveProducts}
          countryCode={countryCode}
        />
      </article>
    </>
  )
}
