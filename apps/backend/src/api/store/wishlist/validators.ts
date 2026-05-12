import { z } from "zod"

export const AddWishlistItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1).optional().nullable(),
})
export type AddWishlistItemSchema = z.infer<typeof AddWishlistItemSchema>
