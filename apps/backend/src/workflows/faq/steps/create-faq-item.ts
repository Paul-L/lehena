import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { FAQ_MODULE, type FaqModuleService } from "../../../modules/faq"

import type { FaqItemCreateInput } from "../../../modules/faq/types"

interface CreateFaqItemStepInput {
  product_id: string
  data: FaqItemCreateInput
}

interface Snapshot {
  faq_item_id: string
}

export const createFaqItemStep = createStep(
  "create-faq-item",
  async (
    input: CreateFaqItemStepInput,
    { container }
  ): Promise<StepResponse<{ id: string }, Snapshot>> => {
    const faq = container.resolve<FaqModuleService>(FAQ_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const [created] = await faq.createFaqItems([
      {
        question: input.data.question,
        answer: input.data.answer,
        position: input.data.position ?? 0,
      },
    ])

    await link.create({
      [Modules.PRODUCT]: { product_id: input.product_id },
      [FAQ_MODULE]: { faq_item_id: created.id },
    })

    return new StepResponse({ id: created.id }, { faq_item_id: created.id })
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const faq = container.resolve<FaqModuleService>(FAQ_MODULE)
    // Cascade on the link removes the link automatically when the item dies.
    await faq.deleteFaqItems(snapshot.faq_item_id)
  }
)
