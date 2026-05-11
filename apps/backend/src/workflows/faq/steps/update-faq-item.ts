import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { FAQ_MODULE } from "../../../modules/faq"

import type { FaqItemUpdateInput } from "../../../modules/faq/types"

interface UpdateFaqItemStepInput {
  id: string
  data: FaqItemUpdateInput
}

interface Snapshot {
  previous: {
    id: string
    question: string
    answer: string
    position: number
  }
}

export const updateFaqItemStep = createStep(
  "update-faq-item",
  async (
    input: UpdateFaqItemStepInput,
    { container }
  ): Promise<StepResponse<{ id: string }, Snapshot>> => {
    const faq = container.resolve(FAQ_MODULE)
    const existing = await faq.retrieveFaqItem(input.id)
    await faq.updateFaqItems({
      id: input.id,
      ...input.data,
    })
    return new StepResponse(
      { id: input.id },
      {
        previous: {
          id: existing.id,
          question: existing.question,
          answer: existing.answer,
          position: existing.position,
        },
      }
    )
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const faq = container.resolve(FAQ_MODULE)
    await faq.updateFaqItems({
      id: snapshot.previous.id,
      question: snapshot.previous.question,
      answer: snapshot.previous.answer,
      position: snapshot.previous.position,
    })
  }
)
