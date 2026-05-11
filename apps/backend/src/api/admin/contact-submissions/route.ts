import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { CONTACT_MODULE } from "../../../modules/contact"

import { type ListContactSubmissionsQuerySchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { limit, offset, status, q } =
    req.validatedQuery as ListContactSubmissionsQuerySchema

  const take = limit ?? 30
  const skip = offset ?? 0

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (q) {
    filters.$or = [
      { email: { $ilike: `%${q}%` } },
      { name: { $ilike: `%${q}%` } },
      { subject: { $ilike: `%${q}%` } },
    ]
  }

  const service = req.scope.resolve(CONTACT_MODULE)

  const [submissions, count] = await service.listAndCountContactSubmissions(
    filters,
    {
      take,
      skip,
      order: { created_at: "DESC" },
    }
  )

  return res.json({ submissions, count, limit: take, offset: skip })
}
