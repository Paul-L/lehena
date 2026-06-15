import { z } from "zod"

const intFromString = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = parseInt(val, 10)
    return Number.isNaN(parsed) ? val : parsed
  }
  return val
}

export const ListMigrationRunsQuerySchema = z
  .object({
    limit: z.preprocess(
      intFromString,
      z.number().int().min(1).max(100).optional()
    ),
    offset: z.preprocess(intFromString, z.number().int().min(0).optional()),
    script: z.enum(["products", "customers", "media"]).optional(),
    status: z.enum(["pending", "running", "completed", "failed"]).optional(),
  })
  .strict()
export type ListMigrationRunsQuerySchema = z.infer<
  typeof ListMigrationRunsQuerySchema
>

export const CreateMigrationRunSchema = z
  .object({
    script: z.enum(["products", "customers", "media"]),
    source: z.enum(["api", "fixtures"]),
    commit: z.boolean().default(false),
    limit: z.number().int().min(1).max(10_000).optional(),
  })
  .strict()
export type CreateMigrationRunSchema = z.infer<typeof CreateMigrationRunSchema>
