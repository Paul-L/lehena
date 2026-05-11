import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { REDIRECTS_MODULE } from "../../../modules/redirects"
import { createRedirectWorkflow } from "../../../workflows/redirects/create-redirect"

import {
  type CreateRedirectSchema,
  type ListRedirectsQuerySchema,
} from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit, offset, source, q } =
    req.validatedQuery as ListRedirectsQuerySchema
  const take = limit ?? 50
  const skip = offset ?? 0

  const filters: Record<string, unknown> = {}
  if (source) {
    filters.source = source
  }
  if (q) {
    filters.$or = [
      { from_path: { $ilike: `%${q}%` } },
      { to_path: { $ilike: `%${q}%` } },
    ]
  }

  const redirects = req.scope.resolve(REDIRECTS_MODULE)
  const [items, count] = await redirects.listAndCountRedirects(filters, {
    take,
    skip,
    order: { created_at: "DESC" },
  })

  return res.json({ redirects: items, count, limit: take, offset: skip })
}

export async function POST(
  req: MedusaRequest<CreateRedirectSchema>,
  res: MedusaResponse
) {
  const { result } = await createRedirectWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.status(201).json({ redirect: result })
}
