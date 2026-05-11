import { type z } from "zod"

import { FaqItemUpdateSchema } from "../../../../modules/faq/types"

export const UpdateFaqItemSchema = FaqItemUpdateSchema
export type UpdateFaqItemSchema = z.infer<typeof UpdateFaqItemSchema>
