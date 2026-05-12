import { z } from "zod"

export const UnsubscribeSchema = z.object({
  token: z.string().min(20).max(2000),
})
export type UnsubscribeSchema = z.infer<typeof UnsubscribeSchema>
