import { z } from "zod"

export const RequestMagicLinkSchema = z.object({
  email: z.string().email().max(200),
})
export type RequestMagicLinkSchema = z.infer<typeof RequestMagicLinkSchema>

export const VerifyMagicLinkSchema = z.object({
  token: z.string().min(20).max(2000),
})
export type VerifyMagicLinkSchema = z.infer<typeof VerifyMagicLinkSchema>
