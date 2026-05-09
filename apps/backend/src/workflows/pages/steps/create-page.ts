import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PAGES_MODULE } from "../../../modules/pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "../../../modules/pages/types"

export type CreatePageStepInput = {
  slug: string
  title: string
  content?: Record<string, unknown> | null
  excerpt?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  locale?: string
}

export const createPageStep = createStep(
  "create-page",
  async (input: CreatePageStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)

    if (!PAGE_SLUG_REGEX.test(input.slug)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid slug "${input.slug}": must be lowercase kebab-case (a-z, 0-9, hyphens).`
      )
    }

    if (
      PAGE_RESERVED_SLUGS.includes(
        input.slug as (typeof PAGE_RESERVED_SLUGS)[number]
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Slug "${input.slug}" is reserved.`
      )
    }

    const existing = await pagesService.listPages({ slug: input.slug })
    if (existing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `A page with slug "${input.slug}" already exists.`
      )
    }

    const page = await pagesService.createPages(input)

    return new StepResponse(page, page.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const pagesService = container.resolve(PAGES_MODULE)
    await pagesService.deletePages(id)
  }
)
