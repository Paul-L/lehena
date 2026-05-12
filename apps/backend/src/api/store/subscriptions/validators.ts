import { z } from "zod"

export const StartCheckoutSchema = z.object({
  plan_slug: z.string().min(1).max(60),
  gift_message: z.string().max(200).optional(),
})
export type StartCheckoutSchema = z.infer<typeof StartCheckoutSchema>

export const MutateSubscriptionSchema = z.object({
  kind: z.enum(["pause", "resume", "cancel"]),
})
export type MutateSubscriptionSchema = z.infer<typeof MutateSubscriptionSchema>
