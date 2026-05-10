import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllPublishedPages, getPageBySlug } from "@lib/data/pages"
import {
  TiptapContent,
  type JSONContent,
} from "@lib/tiptap-renderer"
import { getBaseURL } from "@lib/util/env"
import { PreviewBanner } from "../../../../components/preview-banner"

type Params = { countryCode: string; slug: string }
type SearchParams = { preview?: string }

type Props = {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}

// 1h ISR fallback. The backend's /api/revalidate hook also flushes pages
// on publish/update/unpublish/delete, so this is a safety net for the
// (rare) cases where the webhook misses.
export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const pages = await getAllPublishedPages()
    return pages.map((p) => ({
      countryCode: p.locale,
      slug: p.slug,
    }))
  } catch {
    // If the backend is unreachable at build time, return an empty list
    // and let Next.js render on demand.
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode, slug } = await props.params
  const { preview } = await props.searchParams
  const page = await getPageBySlug(slug, { previewToken: preview })

  if (!page) {
    return { title: "Page introuvable" }
  }

  const title = page.meta_title ?? page.title
  const description = page.meta_description ?? page.excerpt ?? undefined
  const baseUrl = getBaseURL()
  const canonical = `${baseUrl.replace(/\/$/, "")}/${countryCode}/${page.slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: page.og_image_url
        ? [{ url: page.og_image_url, alt: page.title }]
        : undefined,
    },
    twitter: {
      card: page.og_image_url ? "summary_large_image" : "summary",
      title,
      description,
      images: page.og_image_url ? [page.og_image_url] : undefined,
    },
    // Drafts visited via preview token must not be indexed.
    robots:
      page.status === "draft" ? { index: false, follow: false } : undefined,
  }
}

export default async function StorefrontPage(props: Props) {
  const { slug } = await props.params
  const { preview } = await props.searchParams
  const page = await getPageBySlug(slug, { previewToken: preview })

  if (!page) {
    notFound()
  }

  const isPreview = !!preview
  const isDraft = page.status === "draft"

  return (
    <>
      {isPreview && <PreviewBanner isDraft={isDraft} />}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {page.title}
          </h1>
          {page.published_at && (
            <p className="mt-3 text-sm text-gray-500">
              Publié le{" "}
              {new Date(page.published_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </header>
        <TiptapContent content={page.content as JSONContent | null} />
      </article>
    </>
  )
}
