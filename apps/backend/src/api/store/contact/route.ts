import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { submitContactFormWorkflow } from "../../../workflows/contact"

import { type SubmitContactSchema } from "./validators"

export async function POST(
  req: MedusaRequest<SubmitContactSchema>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  const locale =
    (req as MedusaRequest & { locale?: string }).locale ?? body.locale ?? "fr"

  // Best-effort metadata capture for triage in the admin.
  const metadata: Record<string, unknown> = {}
  const ua = req.headers["user-agent"]
  if (typeof ua === "string") metadata.user_agent = ua
  const referer = req.headers.referer
  if (typeof referer === "string") metadata.referer = referer
  if (body.source_slug) metadata.source_slug = body.source_slug

  const { result } = await submitContactFormWorkflow(req.scope).run({
    input: {
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      locale,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    },
  })

  return res.json({
    submission: { id: result.id, status: result.status },
  })
}
