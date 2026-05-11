import { z } from "zod"

const localeSchema = z.string().min(2).max(10)

export const SubmitContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
  locale: localeSchema.optional(),
  source_slug: z.string().max(120).optional(),
})
export type SubmitContactSchema = z.infer<typeof SubmitContactSchema>
