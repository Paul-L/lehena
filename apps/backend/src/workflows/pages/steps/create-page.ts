import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { PAGES_MODULE } from "../../../modules/pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "../../../modules/pages/types"

export interface CreatePageStepInput {
  slug: string
  title: string
  content?: Record<string, unknown> | null
  excerpt?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  noindex?: boolean
  canonical_override?: string | null
  locale?: string
  translation_group_id?: string | null
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

    const locale = input.locale ?? "fr"
    const existing = await pagesService.listPages({
      slug: input.slug,
      locale,
    })
    if (existing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `A page with slug "${input.slug}" already exists for locale "${locale}".`
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
