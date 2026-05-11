import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  createContactSubmissionStep,
  type CreateContactSubmissionStepInput,
} from "./steps/create-contact-submission"

export type SubmitContactFormInput = CreateContactSubmissionStepInput

/**
 * Records an inbound contact form submission. Email forwarding to
 * contact@lehena.fr happens in Phase 7 via the email module (currently a
 * console.log in dev). For now we only persist + emit an event so the admin
 * can see new messages immediately.
 */
export const submitContactFormWorkflow = createWorkflow(
  "submit-contact-form",
  function (input: SubmitContactFormInput) {
    const submission = createContactSubmissionStep(input)

    emitEventStep({
      eventName: "contact.submitted",
      data: {
        id: submission.id,
        email: submission.email,
        subject: submission.subject,
        locale: submission.locale,
      },
    })

    return new WorkflowResponse(submission)
  }
)
