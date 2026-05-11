import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { createFaqItemWorkflow } from "../../../../../workflows/faq/create-faq-item"

import type { CreateProductFaqItemSchema } from "./validators"

interface FaqItemRow {
  id: string
  question: string
  answer: string
  position: number
  created_at: string | Date
  updated_at: string | Date
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id: productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "faq_items.id",
      "faq_items.question",
      "faq_items.answer",
      "faq_items.position",
      "faq_items.created_at",
      "faq_items.updated_at",
    ],
    filters: { id: productId },
  })

  const product = data[0]
  if (!product) {
    return res.status(404).json({ message: "Product not found" })
  }

  const items: FaqItemRow[] = (product.faq_items ?? []) as FaqItemRow[]
  const sorted = items.sort(
    (a, b) =>
      a.position - b.position ||
      String(a.created_at).localeCompare(String(b.created_at))
  )

  return res.json({ faq_items: sorted, count: sorted.length })
}

export async function POST(
  req: MedusaRequest<CreateProductFaqItemSchema>,
  res: MedusaResponse
) {
  const { id: productId } = req.params
  const { result } = await createFaqItemWorkflow(req.scope).run({
    input: { product_id: productId, data: req.validatedBody },
  })
  return res.status(201).json({ faq_item: result })
}
