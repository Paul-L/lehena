import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { FAQ_MODULE } from "../../../modules/faq"

import type { FaqItemsReorderInput } from "../../../modules/faq/types"

interface Snapshot {
  previous: { id: string; position: number }[]
}

export const reorderFaqItemsStep = createStep(
  "reorder-faq-items",
  async (
    input: FaqItemsReorderInput,
    { container }
  ): Promise<StepResponse<{ count: number }, Snapshot>> => {
    const faq = container.resolve(FAQ_MODULE)
    const ids = input.items.map((i) => i.id)
    const existing = await faq.listFaqItems({ id: ids })
    const previousPositions = existing.map((e) => ({
      id: e.id,
      position: e.position,
    }))

    await Promise.all(
      input.items.map((it) =>
        faq.updateFaqItems({ id: it.id, position: it.position })
      )
    )

    return new StepResponse(
      { count: input.items.length },
      { previous: previousPositions }
    )
  },
  async (snapshot, { container }) => {
    if (!snapshot) return
    const faq = container.resolve(FAQ_MODULE)
    await Promise.all(
      snapshot.previous.map((it) =>
        faq.updateFaqItems({ id: it.id, position: it.position })
      )
    )
  }
)
