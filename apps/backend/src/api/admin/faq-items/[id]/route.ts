import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { deleteFaqItemWorkflow } from "../../../../workflows/faq/delete-faq-item"
import { updateFaqItemWorkflow } from "../../../../workflows/faq/update-faq-item"

import type { UpdateFaqItemSchema } from "./validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "faq_item",
    fields: [
      "id",
      "question",
      "answer",
      "position",
      "created_at",
      "updated_at",
    ],
    filters: { id },
  })
  if (data.length === 0) {
    return res.status(404).json({ message: "FAQ item not found" })
  }
  return res.json({ faq_item: data[0] })
}

export async function POST(
  req: MedusaRequest<UpdateFaqItemSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  await updateFaqItemWorkflow(req.scope).run({
    input: { id, data: req.validatedBody },
  })
  return res.json({ id })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  await deleteFaqItemWorkflow(req.scope).run({ input: { id } })
  return res.json({ id, object: "faq_item", deleted: true })
}
