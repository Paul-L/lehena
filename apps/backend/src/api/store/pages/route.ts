import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { PAGES_MODULE, type PagesModuleService } from "../../../modules/pages"
import { type ListStorePagesQuerySchema } from "../../admin/pages/validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pagesService = req.scope.resolve<PagesModuleService>(PAGES_MODULE)

  const { limit, offset } = req.validatedQuery as ListStorePagesQuerySchema
  const locale = (req as MedusaRequest & { locale?: string }).locale

  const take = limit ?? 20
  const skip = offset ?? 0

  const filters: Record<string, unknown> = { status: "published" }
  if (locale) {
    filters.locale = locale
  }

  const [rows, count] = await pagesService.listAndCountPages(filters, {
    take,
    skip,
    order: { published_at: "DESC" },
  })

  const pages = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    meta_title: p.meta_title,
    meta_description: p.meta_description,
    og_image_url: p.og_image_url,
    noindex: p.noindex,
    locale: p.locale,
    translation_group_id: p.translation_group_id,
    published_at: p.published_at,
  }))

  return res.json({ pages, count, limit: take, offset: skip })
}
