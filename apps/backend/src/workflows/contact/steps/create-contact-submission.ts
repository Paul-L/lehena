import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  CONTACT_MODULE,
  type ContactModuleService,
} from "../../../modules/contact"

export interface CreateContactSubmissionStepInput {
  name: string
  email: string
  subject: string
  message: string
  locale?: string
  metadata?: Record<string, unknown> | null
}

export const createContactSubmissionStep = createStep(
  "create-contact-submission",
  async (input: CreateContactSubmissionStepInput, { container }) => {
    const service = container.resolve<ContactModuleService>(CONTACT_MODULE)
    const created = await service.createContactSubmissions({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      locale: input.locale ?? "fr",
      metadata: input.metadata ?? null,
      status: "new",
    })
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service = container.resolve<ContactModuleService>(CONTACT_MODULE)
    await service.deleteContactSubmissions(id)
  }
)
