import "server-only"
import { sdk } from "@lib/config"

export type PageStatus = "draft" | "published"

export interface Page {
  id: string
  slug: string
  title: string
  content: Record<string, unknown> | null
  excerpt: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  noindex: boolean
  canonical_override: string | null
  status: PageStatus
  published_at: string | null
  locale: string
  translation_group_id: string | null
  /** Editorial type — distinguishes pillar pages from blog articles. */
  type?: "page" | "article" | "recipe" | "news"
  author_id?: string | null
  tags?: string[] | null
  pillar_slug?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PageTranslation {
  id: string
  locale: string
  slug: string
}

export type PageSummary = Pick<
  Page,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "meta_title"
  | "meta_description"
  | "og_image_url"
  | "locale"
  | "published_at"
> & {
  noindex?: boolean
  translation_group_id?: string | null
  /** Editorial type (Phase 9 extension). Defaults to "page" when absent. */
  type?: "page" | "article" | "recipe" | "news"
}

const REVALIDATE_SECONDS = 3600

interface FetchError {
  status?: number
  statusCode?: number
}

const isNotFound = (err: unknown): boolean => {
  const e = err as FetchError
  return e?.status === 404 || e?.statusCode === 404
}

/**
 * Fetches a single page by slug from the Medusa store API.
 *
 * Returns `null` on 404 (slug not found, or page is draft and no/invalid
 * preview token). Re-throws all other errors so the caller (route handler)
 * can surface a real 500.
 *
 * Pass `previewToken` to view drafts: it's forwarded as the
 * `x-preview-token` header that the backend verifies as a JWT (or the raw
 * PREVIEW_SECRET).
 */
export async function getPageBySlug(
  slug: string,
  options: { previewToken?: string; locale?: string } = {}
): Promise<{ page: Page; translations: PageTranslation[] } | null> {
  const headers: Record<string, string> = {}
  if (options.previewToken) {
    headers["x-preview-token"] = options.previewToken
  }
  if (options.locale) {
    headers["x-medusa-locale"] = options.locale
  }

  try {
    const result = await sdk.client.fetch<{
      page: Page
      translations?: PageTranslation[]
    }>(`/store/pages/${encodeURIComponent(slug)}`, {
      headers,
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["pages", `page-${slug}`],
      },
    })
    return {
      page: result.page,
      translations: result.translations ?? [],
    }
  } catch (err) {
    if (isNotFound(err)) return null
    throw err
  }
}

/**
 * Returns every published page across all locales — used by sitemap and
 * `generateStaticParams`. Bypasses the SDK's automatic `x-medusa-locale`
 * injection by passing an empty header so the backend does not filter by
 * the current visitor's locale.
 */
export async function getAllPublishedPages(): Promise<PageSummary[]> {
  const all: PageSummary[] = []
  const LIMIT = 100
  let offset = 0

  while (true) {
    const resp = await sdk.client.fetch<{
      pages: PageSummary[]
      count: number
      limit: number
      offset: number
    }>("/store/pages", {
      query: { limit: LIMIT, offset },
      headers: { "x-medusa-locale": "" },
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["pages"],
      },
    })

    all.push(...resp.pages)
    if (resp.pages.length === 0 || all.length >= resp.count) {
      break
    }
    offset += LIMIT
  }

  return all
}
