import { z } from "zod"

export const RESOURCE_TYPE_VALUES = ["product", "category", "page"] as const
export type ResourceType = (typeof RESOURCE_TYPE_VALUES)[number]

export const REDIRECT_SOURCE_VALUES = [
  "product",
  "category",
  "page",
  "manual",
] as const
export type RedirectSource = (typeof REDIRECT_SOURCE_VALUES)[number]

// Allowed HTTP redirect status codes.
export const REDIRECT_STATUSES = [301, 302, 307, 308] as const
export type RedirectStatus = (typeof REDIRECT_STATUSES)[number]

const PATH_REGEX = /^\/[\w/\-.~%]*$/

export const CreateRedirectInputSchema = z
  .object({
    from_path: z.string().regex(PATH_REGEX, "Must be an absolute path"),
    to_path: z.string().regex(PATH_REGEX, "Must be an absolute path"),
    status: z
      .union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)])
      .default(301),
    source: z.enum(REDIRECT_SOURCE_VALUES).default("manual"),
    source_id: z.string().nullable().optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .strict()
  .refine((v) => v.from_path !== v.to_path, {
    message: "from_path and to_path must differ",
    path: ["to_path"],
  })
export type CreateRedirectInput = z.infer<typeof CreateRedirectInputSchema>

// Route prefixes used by the handle-change subscribers + the storefront
// middleware that will consume the table in Phase 8.
export const RESOURCE_PATH_PREFIX: Record<ResourceType, string> = {
  product: "/produits",
  category: "/categories",
  page: "",
}

export function buildResourcePath(
  resource: ResourceType,
  handle: string
): string {
  const prefix = RESOURCE_PATH_PREFIX[resource]
  return `${prefix}/${handle}`
}
