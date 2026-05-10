import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type PageStatus = "draft" | "published"

export type Page = {
  id: string
  slug: string
  title: string
  content: Record<string, unknown> | null
  excerpt: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  status: PageStatus
  published_at: string | null
  locale: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ListPagesQuery = {
  limit?: number
  offset?: number
  status?: PageStatus
  locale?: string
  q?: string
  slug?: string
}

export type ListPagesResponse = {
  pages: Page[]
  count: number
  limit: number
  offset: number
}

export type SinglePageResponse = { page: Page }
export type DeletePageResponse = { id: string; object: "page"; deleted: true }

export type CreatePageInput = {
  slug: string
  title: string
  content?: Record<string, unknown> | null
  excerpt?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  locale?: string
}

export type UpdatePageInput = Partial<CreatePageInput>

const PAGES_QUERY_KEY = "pages" as const

export const pagesKeys = {
  all: [PAGES_QUERY_KEY] as const,
  lists: () => [...pagesKeys.all, "list"] as const,
  list: (query: ListPagesQuery) => [...pagesKeys.lists(), query] as const,
  details: () => [...pagesKeys.all, "detail"] as const,
  detail: (id: string) => [...pagesKeys.details(), id] as const,
  slugCheck: (slug: string, excludeId?: string) =>
    [...pagesKeys.all, "slug-check", slug, excludeId ?? null] as const,
}

const invalidatePages = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: pagesKeys.lists() }),
    qc.invalidateQueries({ queryKey: pagesKeys.details() }),
  ])

/* -------------------------------------------------------------------- */
/* Queries                                                              */
/* -------------------------------------------------------------------- */

export const usePages = (query: ListPagesQuery = {}) =>
  useQuery({
    queryKey: pagesKeys.list(query),
    queryFn: () =>
      sdk.client.fetch<ListPagesResponse>("/admin/pages", {
        query: query as Record<string, unknown>,
      }),
  })

export const usePage = (id: string | undefined | null) =>
  useQuery({
    queryKey: pagesKeys.detail(id ?? ""),
    queryFn: () =>
      sdk.client.fetch<SinglePageResponse>(`/admin/pages/${id}`),
    enabled: !!id,
  })

export const useCheckSlugAvailability = (
  slug: string,
  excludeId?: string
) =>
  useQuery({
    queryKey: pagesKeys.slugCheck(slug, excludeId),
    queryFn: async () => {
      if (!slug) return { available: true as const }
      const resp = await sdk.client.fetch<ListPagesResponse>(
        "/admin/pages",
        {
          query: { slug, limit: 1 },
        }
      )
      const conflict = resp.pages.find((p) => p.id !== excludeId)
      return { available: !conflict }
    },
    enabled: !!slug && slug.length > 0,
    staleTime: 1000 * 5,
  })

/* -------------------------------------------------------------------- */
/* Mutations                                                            */
/* -------------------------------------------------------------------- */

export const useCreatePage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePageInput) =>
      sdk.client.fetch<SinglePageResponse>("/admin/pages", {
        method: "POST",
        body: input,
      }),
    onSuccess: async (data) => {
      qc.setQueryData(pagesKeys.detail(data.page.id), data)
      await qc.invalidateQueries({ queryKey: pagesKeys.lists() })
    },
  })
}

export const useUpdatePage = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdatePageInput) =>
      sdk.client.fetch<SinglePageResponse>(`/admin/pages/${id}`, {
        method: "POST",
        body: input,
      }),
    onSuccess: async (data) => {
      qc.setQueryData(pagesKeys.detail(id), data)
      await qc.invalidateQueries({ queryKey: pagesKeys.lists() })
    },
  })
}

export const useDeletePage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<DeletePageResponse>(`/admin/pages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await invalidatePages(qc)
    },
  })
}

export const usePublishPage = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<SinglePageResponse>(
        `/admin/pages/${id}/publish`,
        { method: "POST" }
      ),
    onSuccess: async (data) => {
      qc.setQueryData(pagesKeys.detail(id), data)
      await qc.invalidateQueries({ queryKey: pagesKeys.lists() })
    },
  })
}

export const useUnpublishPage = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<SinglePageResponse>(
        `/admin/pages/${id}/unpublish`,
        { method: "POST" }
      ),
    onSuccess: async (data) => {
      qc.setQueryData(pagesKeys.detail(id), data)
      await qc.invalidateQueries({ queryKey: pagesKeys.lists() })
    },
  })
}

export type PreviewTokenResponse = {
  token: string
  expires_in: number
}

/**
 * Fetches a fresh short-lived (1h) preview JWT used to view drafts on the
 * storefront. Uses useMutation rather than useQuery: each "Voir le site"
 * click should mint a fresh token to avoid using one that has expired in
 * a stale cache entry.
 */
export const useFetchPreviewToken = () =>
  useMutation({
    mutationFn: () =>
      sdk.client.fetch<PreviewTokenResponse>(
        "/admin/pages/preview-token"
      ),
  })
