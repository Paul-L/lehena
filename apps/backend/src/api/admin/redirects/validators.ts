import { z } from "zod"

import { CreateRedirectInputSchema } from "../../../modules/redirects/types"

export const CreateRedirectSchema = CreateRedirectInputSchema
export type CreateRedirectSchema = z.infer<typeof CreateRedirectSchema>

export const ListRedirectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  source: z.enum(["product", "category", "page", "manual"]).optional(),
  q: z.string().min(1).max(200).optional(),
})
export type ListRedirectsQuerySchema = z.infer<typeof ListRedirectsQuerySchema>
