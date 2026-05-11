import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { createPageTranslationWorkflow } from "../../../../../workflows/pages"
import { type TranslatePageSchema } from "../../validators"

export async function POST(
  req: MedusaRequest<TranslatePageSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { target_locale, slug } = req.validatedBody

  const { result } = await createPageTranslationWorkflow(req.scope).run({
    input: { source_id: id, target_locale, slug },
  })

  return res.json({ page: result })
}
