import { MeiliSearch } from "meilisearch"

/**
 * Server-side MeiliSearch client. Uses the PUBLIC search key (read-only,
 * scoped to the products + categories indexes). Never expose the admin/master
 * API key here.
 *
 * The host and search key default to local docker values to keep dev boot
 * happy when no .env is filled.
 */
const HOST =
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST ??
  process.env.MEILISEARCH_HOST ??
  "http://localhost:7700"
const KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ??
  process.env.MEILISEARCH_SEARCH_KEY ??
  ""

let client: MeiliSearch | null = null
function getClient(): MeiliSearch {
  if (!client) {
    client = new MeiliSearch({ host: HOST, apiKey: KEY })
  }
  return client
}

export interface SearchProductHit {
  id: string
  handle: string
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string | null
  categories?: { id: string; handle: string; name: string }[]
}

export interface SearchCategoryHit {
  id: string
  handle: string
  name: string
  description?: string
}

interface SearchResult<T> {
  hits: T[]
  estimatedTotalHits: number
  processingTimeMs: number
}

/** Full text product search. Used by /recherche. */
export async function searchProducts(
  query: string,
  opts?: { limit?: number; offset?: number }
): Promise<SearchResult<SearchProductHit>> {
  if (!query.trim()) {
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
  try {
    const res = await getClient()
      .index("products")
      .search<SearchProductHit>(query, {
        limit: opts?.limit ?? 24,
        offset: opts?.offset ?? 0,
      })
    return {
      hits: res.hits,
      estimatedTotalHits: res.estimatedTotalHits ?? res.hits.length,
      processingTimeMs: res.processingTimeMs ?? 0,
    }
  } catch {
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
}

/** Categorie search. */
export async function searchCategories(
  query: string,
  opts?: { limit?: number }
): Promise<SearchResult<SearchCategoryHit>> {
  if (!query.trim()) {
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
  try {
    const res = await getClient()
      .index("categories")
      .search<SearchCategoryHit>(query, {
        limit: opts?.limit ?? 5,
      })
    return {
      hits: res.hits,
      estimatedTotalHits: res.estimatedTotalHits ?? res.hits.length,
      processingTimeMs: res.processingTimeMs ?? 0,
    }
  } catch {
    return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 }
  }
}

export interface AutocompleteResult {
  products: SearchProductHit[]
  categories: SearchCategoryHit[]
  /** Stub for Phase 9 — articles come later. */
  articles: never[]
}

/**
 * Header drawer autocomplete: 5 products + 3 categories + (stub) articles.
 * Both indexes are queried in parallel.
 */
export async function searchAutocomplete(
  query: string
): Promise<AutocompleteResult> {
  const [products, categories] = await Promise.all([
    searchProducts(query, { limit: 5 }),
    searchCategories(query, { limit: 3 }),
  ])
  return {
    products: products.hits,
    categories: categories.hits,
    articles: [],
  }
}
