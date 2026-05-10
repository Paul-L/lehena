import { z } from "zod"

// Mirrors the backend zod schemas from src/api/admin/pages/validators.ts.
// The backend remains the source of truth — these client schemas exist for
// react-hook-form integration; server-side validation will reject any
// invalid payload regardless.

export const PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const PAGE_RESERVED_SLUGS = [
  "cart",
  "checkout",
  "products",
  "product",
  "account",
  "admin",
  "api",
  "store",
  "collections",
  "categories",
  "search",
  "login",
  "register",
  "orders",
  "_next",
  "static",
] as const

export const pageFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  slug: z
    .string()
    .min(1, "Le slug est requis")
    .max(120)
    .regex(PAGE_SLUG_REGEX, "Format invalide (kebab-case uniquement)")
    .refine(
      (s) => !PAGE_RESERVED_SLUGS.includes(s as (typeof PAGE_RESERVED_SLUGS)[number]),
      "Slug réservé"
    ),
  content: z.record(z.string(), z.unknown()).nullable(),
  excerpt: z.string().max(300).nullable(),
  meta_title: z.string().max(70).nullable(),
  meta_description: z.string().max(160).nullable(),
  og_image_url: z
    .union([z.string().url(), z.string().length(0), z.null()])
    .transform((v) => (v ? v : null)),
  locale: z.string().min(2).max(10),
})

export type PageFormValues = z.infer<typeof pageFormSchema>
