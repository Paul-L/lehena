import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { AUTHOR_MODULE } from "../../../../modules/author"
import {
  PAGES_MODULE,
  type PagesModuleService,
} from "../../../../modules/pages"

interface AuthorRow {
  id: string
  slug: string
  name: string
  bio: string | null
  photo_url: string | null
  social_links: { platform: string; url: string }[] | null
  role_title: string | null
  credentials: string[] | null
  email: string | null
  locale: string
}

interface AuthorServiceLike {
  listAuthors(
    filters?: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<AuthorRow[]>
}

/**
 * Public author profile by slug (or id — the storefront byline resolves an
 * author from `page.author_id`, so both lookups hit this endpoint).
 *
 * Returns the author's public fields plus the list of their published pages,
 * so the storefront `/auteurs/[slug]` page can render a crawlable profile
 * with at least one linked article (empty profiles are ignored by Google).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { slug } = req.params
  const authorService = req.scope.resolve(AUTHOR_MODULE) as AuthorServiceLike
  const pagesService = req.scope.resolve<PagesModuleService>(PAGES_MODULE)

  // Match by slug first; fall back to id (byline lookup uses author_id).
  let [author] = await authorService.listAuthors({ slug }, { take: 1 })
  if (!author) {
    ;[author] = await authorService.listAuthors({ id: slug }, { take: 1 })
  }

  if (!author) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Author not found")
  }

  const locale = (req as MedusaRequest & { locale?: string }).locale

  const pageFilters: Record<string, unknown> = {
    author_id: author.id,
    status: "published",
  }
  if (locale) {
    pageFilters.locale = locale
  }

  const pages = await pagesService.listPages(pageFilters, {
    take: 50,
    order: { published_at: "DESC" },
  })

  const articles = pages.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    type: p.type,
    locale: p.locale,
    published_at: p.published_at,
  }))

  return res.json({
    author: {
      id: author.id,
      slug: author.slug,
      name: author.name,
      bio: author.bio,
      photo_url: author.photo_url,
      role_title: author.role_title,
      credentials: author.credentials,
      social_links: author.social_links,
      locale: author.locale,
    },
    articles,
  })
}
