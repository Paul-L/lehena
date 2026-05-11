import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { reorderFaqItemsWorkflow } from "../../../../../../workflows/faq/reorder-faq-items"

import type { ReorderProductFaqItemsSchema } from "../validators"

export async function POST(
  req: MedusaRequest<ReorderProductFaqItemsSchema>,
  res: MedusaResponse
) {
  const { result } = await reorderFaqItemsWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.json(result)
}
