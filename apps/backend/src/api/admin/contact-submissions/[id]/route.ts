import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { CONTACT_MODULE } from "../../../../modules/contact"
import { type UpdateContactSubmissionSchema } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const service = req.scope.resolve(CONTACT_MODULE)
  const submission = await service.retrieveContactSubmission(id)
  if (!submission) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Contact submission ${id} not found`
    )
  }
  // Mark as read on first GET if still "new".
  if (submission.status === "new") {
    await service.updateContactSubmissions({
      id,
      status: "read",
      read_at: new Date(),
    })
    submission.status = "read"
  }
  return res.json({ submission })
}

export async function POST(
  req: MedusaRequest<UpdateContactSubmissionSchema>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { status } = req.validatedBody
  const service = req.scope.resolve(CONTACT_MODULE)

  const patch: Record<string, unknown> = { id, status }
  if (status === "read") patch.read_at = new Date()
  if (status === "replied") patch.replied_at = new Date()

  const updated = await service.updateContactSubmissions(patch)
  return res.json({ submission: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const service = req.scope.resolve(CONTACT_MODULE)
  await service.deleteContactSubmissions(id)
  return res.json({ id, object: "contact_submission", deleted: true })
}
