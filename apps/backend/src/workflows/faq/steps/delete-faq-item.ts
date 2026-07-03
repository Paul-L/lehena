import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { FAQ_MODULE, type FaqModuleService } from "../../../modules/faq"

interface Snapshot {
  id: string
  question: string
  answer: string
  position: number
}

export const deleteFaqItemStep = createStep(
  "delete-faq-item",
  async (
    input: { id: string },
    { container }
  ): Promise<StepResponse<{ id: string }, Snapshot>> => {
    const faq = container.resolve<FaqModuleService>(FAQ_MODULE)
    const existing = await faq.retrieveFaqItem(input.id)
    const snapshot: Snapshot = {
      id: existing.id,
      question: existing.question,
      answer: existing.answer,
      position: existing.position,
    }
    await faq.deleteFaqItems(input.id)
    return new StepResponse({ id: input.id }, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const faq = container.resolve<FaqModuleService>(FAQ_MODULE)
    // Re-create with the same id so any reference stays valid.
    await faq.createFaqItems([
      {
        id: snapshot.id,
        question: snapshot.question,
        answer: snapshot.answer,
        position: snapshot.position,
      },
    ])
  }
)
