import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  REDIRECTS_MODULE,
  type RedirectsModuleService,
} from "../../../modules/redirects"

import type { CreateRedirectInput } from "../../../modules/redirects/types"

export const createRedirectStep = createStep(
  "create-redirect",
  async (input: CreateRedirectInput, { container }) => {
    const redirects =
      container.resolve<RedirectsModuleService>(REDIRECTS_MODULE)
    const [redirect] = await redirects.createRedirects([input])
    return new StepResponse(redirect, redirect.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const redirects =
      container.resolve<RedirectsModuleService>(REDIRECTS_MODULE)
    await redirects.deleteRedirects(id)
  }
)
