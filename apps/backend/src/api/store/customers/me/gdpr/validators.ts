import { z } from "zod"

export const DeleteRequestSchema = z.object({
  /** Customer's current password — confirms it's really them. */
  password: z.string().min(1).max(200),
  /** Optional free-form reason for ops triage. */
  notes: z.string().max(2000).optional(),
})
export type DeleteRequestSchema = z.infer<typeof DeleteRequestSchema>

export const DeleteConfirmSchema = z.object({
  token: z.string().min(20).max(2000),
})
export type DeleteConfirmSchema = z.infer<typeof DeleteConfirmSchema>
