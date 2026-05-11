import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"

import {
  createPageTranslationStep,
  type CreatePageTranslationStepInput,
} from "./steps/create-page-translation"

export type CreatePageTranslationInput = CreatePageTranslationStepInput

export const createPageTranslationWorkflow = createWorkflow(
  "create-page-translation",
  function (input: CreatePageTranslationInput) {
    const page = createPageTranslationStep(input)

    emitEventStep({
      eventName: "page.translated",
      data: {
        id: page.id,
        slug: page.slug,
        locale: page.locale,
        translation_group_id: page.translation_group_id,
      },
    })

    return new WorkflowResponse(page)
  }
)
