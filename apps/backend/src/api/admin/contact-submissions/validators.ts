import { z } from "zod"

const statusSchema = z.enum(["new", "read", "replied", "spam"])

const intFromString = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? val : parsed
  }
  return val
}

export const ListContactSubmissionsQuerySchema = z.object({
  limit: z.preprocess(
    intFromString,
    z.number().int().min(1).max(100).optional()
  ),
  offset: z.preprocess(intFromString, z.number().int().min(0).optional()),
  status: statusSchema.optional(),
  q: z.string().min(1).max(200).optional(),
})
export type ListContactSubmissionsQuerySchema = z.infer<
  typeof ListContactSubmissionsQuerySchema
>

export const UpdateContactSubmissionSchema = z.object({
  status: statusSchema,
})
export type UpdateContactSubmissionSchema = z.infer<
  typeof UpdateContactSubmissionSchema
>
