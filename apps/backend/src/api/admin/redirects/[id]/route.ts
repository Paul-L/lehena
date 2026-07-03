import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  REDIRECTS_MODULE,
  type RedirectsModuleService,
} from "../../../../modules/redirects"
import { deleteRedirectWorkflow } from "../../../../workflows/redirects/delete-redirect"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const redirects = req.scope.resolve<RedirectsModuleService>(REDIRECTS_MODULE)
  try {
    const redirect = await redirects.retrieveRedirect(id)
    return res.json({ redirect })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Redirect ${id} not found`
    )
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  await deleteRedirectWorkflow(req.scope).run({ input: { id } })
  return res.json({ id, deleted: true })
}
