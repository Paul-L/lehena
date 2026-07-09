import { z } from "zod"

export const RequestMagicLinkSchema = z.object({
  email: z.string().email().max(200),
  // Optionnels — présents uniquement pour un signup passwordless via
  // magic-link. Absents pour un login classique.
  first_name: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
})
export type RequestMagicLinkSchema = z.infer<typeof RequestMagicLinkSchema>

export const VerifyMagicLinkSchema = z.object({
  token: z.string().min(20).max(2000),
})
export type VerifyMagicLinkSchema = z.infer<typeof VerifyMagicLinkSchema>
