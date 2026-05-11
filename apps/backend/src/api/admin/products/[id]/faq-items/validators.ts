import { type z } from "zod"

import {
  FaqItemCreateSchema,
  FaqItemsReorderSchema,
} from "../../../../../modules/faq/types"

export const CreateProductFaqItemSchema = FaqItemCreateSchema
export type CreateProductFaqItemSchema = z.infer<
  typeof CreateProductFaqItemSchema
>

export const ReorderProductFaqItemsSchema = FaqItemsReorderSchema
export type ReorderProductFaqItemsSchema = z.infer<
  typeof ReorderProductFaqItemsSchema
>
