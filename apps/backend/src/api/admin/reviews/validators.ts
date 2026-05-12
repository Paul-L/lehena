import { z } from "zod"

const intFromString = (v: unknown) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10)
    return Number.isNaN(n) ? v : n
  }
  return v
}

export const ListAdminReviewsQuerySchema = z.object({
  limit: z.preprocess(
    intFromString,
    z.number().int().min(1).max(100).optional()
  ),
  offset: z.preprocess(intFromString, z.number().int().min(0).optional()),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  product_id: z.string().min(1).optional(),
})
export type ListAdminReviewsQuerySchema = z.infer<
  typeof ListAdminReviewsQuerySchema
>

export const UpdateReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
})
export type UpdateReviewStatusSchema = z.infer<typeof UpdateReviewStatusSchema>
