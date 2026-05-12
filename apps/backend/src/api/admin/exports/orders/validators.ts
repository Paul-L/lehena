import { z } from "zod"

export const ExportOrdersSchema = z.object({
  /** ISO date strings — interpreted as midnight UTC. */
  from: z.string().min(1),
  to: z.string().min(1),
  /** Filter on order status; empty = all. */
  status: z
    .array(z.enum(["pending", "completed", "canceled", "archived"]))
    .optional(),
})
export type ExportOrdersSchema = z.infer<typeof ExportOrdersSchema>
