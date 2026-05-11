import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { unpublishPageWorkflow } from "../../../../../workflows/pages"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await unpublishPageWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ page: result })
}
