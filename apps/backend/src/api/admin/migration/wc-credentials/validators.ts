import { z } from "zod"

export const SaveWcCredentialsSchema = z
  .object({
    url: z.string().url(),
    consumer_key: z.string().min(1),
    consumer_secret: z.string().min(8),
  })
  .strict()
export type SaveWcCredentialsSchema = z.infer<typeof SaveWcCredentialsSchema>
