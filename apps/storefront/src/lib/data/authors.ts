import "server-only"
import { sdk } from "@lib/config"

export interface AuthorSocialLink {
  platform: string
  url: string
}

export interface Author {
  id: string
  slug: string
  name: string
  bio: string | null
  photo_url: string | null
  role_title: string | null
  credentials: string[] | null
  social_links: AuthorSocialLink[] | null
  locale: string
}

export interface AuthorArticle {
  id: string
  slug: string
  title: string
  excerpt: string | null
  type?: "page" | "article" | "recipe" | "news"
  locale: string
  published_at: string | null
}

export interface AuthorWithArticles {
  author: Author
  articles: AuthorArticle[]
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
 * Fetches an author profile (+ their published articles) by slug OR id.
 *
 * The backend `/store/authors/[slug]` route matches on slug first and falls
 * back to id, so `getAuthorBySlug` doubles as `getAuthorById` — the article
 * byline resolves an author from `page.author_id`.
 *
 * Returns `null` on 404 so callers can render a 404 / skip the byline.
 */
export async function getAuthorBySlug(
  slugOrId: string,
  options: { locale?: string } = {}
): Promise<AuthorWithArticles | null> {
  const headers: Record<string, string> = {}
  if (options.locale) {
    headers["x-medusa-locale"] = options.locale
  }

  try {
    const result = await sdk.client.fetch<AuthorWithArticles>(
      `/store/authors/${encodeURIComponent(slugOrId)}`,
      {
        headers,
        next: {
          revalidate: REVALIDATE_SECONDS,
          tags: ["authors", `author-${slugOrId}`],
        },
      }
    )
    return {
      author: result.author,
      articles: result.articles ?? [],
    }
  } catch (err) {
    if (isNotFound(err)) return null
    throw err
  }
}

/** Alias — same endpoint resolves both slug and id. */
export const getAuthorById = getAuthorBySlug
