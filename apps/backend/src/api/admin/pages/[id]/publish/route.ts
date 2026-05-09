import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { publishPageWorkflow } from "../../../../../workflows/pages"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await publishPageWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ page: result })
}
