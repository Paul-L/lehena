import { z } from "zod"

const localeSchema = z.string().min(2).max(10)
const slugSchema = z.string().min(1).max(120)
const statusSchema = z.enum(["draft", "published"])

export const CreatePageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  excerpt: z.string().max(300).optional().nullable(),
  meta_title: z.string().max(70).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  og_image_url: z.string().url().optional().nullable(),
  locale: localeSchema.optional(),
})
export type CreatePageSchema = z.infer<typeof CreatePageSchema>

export const UpdatePageSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  excerpt: z.string().max(300).optional().nullable(),
  meta_title: z.string().max(70).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  og_image_url: z.string().url().optional().nullable(),
  locale: localeSchema.optional(),
})
export type UpdatePageSchema = z.infer<typeof UpdatePageSchema>

const intFromString = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? val : parsed
  }
  return val
}

export const ListPagesQuerySchema = z.object({
  limit: z.preprocess(intFromString, z.number().int().min(1).max(100).optional()),
  offset: z.preprocess(intFromString, z.number().int().min(0).optional()),
  status: statusSchema.optional(),
  locale: localeSchema.optional(),
  q: z.string().min(1).max(200).optional(),
})
export type ListPagesQuerySchema = z.infer<typeof ListPagesQuerySchema>

// Note: `locale` is NOT in this schema because Medusa's framework registers an
// `applyLocale` middleware on /store/* that consumes `?locale=...` and sets
// `req.locale` (then deletes the query key). To filter by locale on store
// routes, read `req.locale` instead — populated from `?locale=fr` or the
// `x-medusa-locale` header.
export const ListStorePagesQuerySchema = z.object({
  limit: z.preprocess(intFromString, z.number().int().min(1).max(100)).optional(),
  offset: z.preprocess(intFromString, z.number().int().min(0)).optional(),
})
export type ListStorePagesQuerySchema = z.infer<typeof ListStorePagesQuerySchema>
