import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PAGES_MODULE } from "../../../modules/pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "../../../modules/pages/types"

export type UpdatePageStepInput = {
  id: string
  slug?: string
  title?: string
  content?: Record<string, unknown> | null
  excerpt?: string | null
  meta_title?: string | null
  meta_description?: string | null
  og_image_url?: string | null
  locale?: string
}

export const updatePageStep = createStep(
  "update-page",
  async (input: UpdatePageStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)

    const before = await pagesService.retrievePage(input.id)

    if (input.slug && input.slug !== before.slug) {
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
      const collision = await pagesService.listPages({ slug: input.slug })
      if (collision.length > 0 && collision[0].id !== input.id) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `A page with slug "${input.slug}" already exists.`
        )
      }
    }

    const updated = await pagesService.updatePages(input)

    return new StepResponse(updated, before)
  },
  async (before, { container }) => {
    if (!before) {
      return
    }
    const pagesService = container.resolve(PAGES_MODULE)
    await pagesService.updatePages({
      id: before.id,
      slug: before.slug,
      title: before.title,
      content: before.content,
      excerpt: before.excerpt,
      meta_title: before.meta_title,
      meta_description: before.meta_description,
      og_image_url: before.og_image_url,
      status: before.status,
      published_at: before.published_at,
      locale: before.locale,
    })
  }
)
