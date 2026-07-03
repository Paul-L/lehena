import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import {
  PAGES_MODULE,
  type PagesModuleService,
} from "../../../../modules/pages"
import {
  deletePageWorkflow,
  updatePageWorkflow,
} from "../../../../workflows/pages"
import { type UpdatePageSchema } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const pagesService = req.scope.resolve<PagesModuleService>(PAGES_MODULE)

  const page = await pagesService.retrievePage(id)

  return res.json({ page })
}

export async function POST(
  req: MedusaRequest<UpdatePageSchema>,
  res: MedusaResponse
) {
  const { id } = req.params

  const { result } = await updatePageWorkflow(req.scope).run({
    input: { id, ...req.validatedBody },
  })

  return res.json({ page: result })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  await deletePageWorkflow(req.scope).run({
    input: { id },
  })

  return res.json({ id, object: "page", deleted: true })
}
