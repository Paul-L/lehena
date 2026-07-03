import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { PAGES_MODULE, type PagesModuleService } from "../../../modules/pages"
import { createPageWorkflow } from "../../../workflows/pages"

import { type CreatePageSchema, type ListPagesQuerySchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit, offset, status, locale, q } =
    req.validatedQuery as ListPagesQuerySchema

  const take = limit ?? 20
  const skip = offset ?? 0

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (locale) filters.locale = locale
  if (q) {
    filters.$or = [
      { title: { $ilike: `%${q}%` } },
      { slug: { $ilike: `%${q}%` } },
    ]
  }

  const pagesService = req.scope.resolve<PagesModuleService>(PAGES_MODULE)

  const [pages, count] = await pagesService.listAndCountPages(filters, {
    take,
    skip,
    order: { updated_at: "DESC" },
  })

  return res.json({ pages, count, limit: take, offset: skip })
}

export async function POST(
  req: MedusaRequest<CreatePageSchema>,
  res: MedusaResponse
) {
  const { result } = await createPageWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.json({ page: result })
}
