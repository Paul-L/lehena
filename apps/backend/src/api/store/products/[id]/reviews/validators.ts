import { z } from "zod"

export const SubmitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(10).max(2000),
})
export type SubmitReviewSchema = z.infer<typeof SubmitReviewSchema>

const intFromString = (v: unknown) => {
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10)
    return Number.isNaN(n) ? v : n
  }
  return v
}

export const ListReviewsQuerySchema = z.object({
  limit: z.preprocess(
    intFromString,
    z.number().int().min(1).max(50).optional()
  ),
  offset: z.preprocess(intFromString, z.number().int().min(0).optional()),
})
export type ListReviewsQuerySchema = z.infer<typeof ListReviewsQuerySchema>
