import { z } from "zod"

export const FaqItemCreateSchema = z
  .object({
    question: z.string().trim().min(3).max(200),
    answer: z.string().trim().min(3).max(2000),
    position: z.number().int().min(0).max(999).default(0),
  })
  .strict()

export type FaqItemCreateInput = z.input<typeof FaqItemCreateSchema>

export const FaqItemUpdateSchema = z
  .object({
    question: z.string().trim().min(3).max(200).optional(),
    answer: z.string().trim().min(3).max(2000).optional(),
    position: z.number().int().min(0).max(999).optional(),
  })
  .strict()

export type FaqItemUpdateInput = z.input<typeof FaqItemUpdateSchema>

export const FaqItemsReorderSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().min(1),
            position: z.number().int().min(0).max(999),
          })
          .strict()
      )
      .min(1)
      .max(50),
  })
  .strict()

export type FaqItemsReorderInput = z.input<typeof FaqItemsReorderSchema>
