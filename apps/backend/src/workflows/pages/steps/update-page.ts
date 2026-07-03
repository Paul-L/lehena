import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { PAGES_MODULE, type PagesModuleService } from "../../../modules/pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "../../../modules/pages/types"

export interface UpdatePageStepInput {
  id: string
  slug?: string
  title?: string
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

export const updatePageStep = createStep(
  "update-page",
  async (input: UpdatePageStepInput, { container }) => {
    const pagesService = container.resolve<PagesModuleService>(PAGES_MODULE)

    const before = await pagesService.retrievePage(input.id)

    const nextSlug = input.slug ?? before.slug
    const nextLocale = input.locale ?? before.locale

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
    }

    if (
      (input.slug && input.slug !== before.slug) ||
      (input.locale && input.locale !== before.locale)
    ) {
      const collision = await pagesService.listPages({
        slug: nextSlug,
        locale: nextLocale,
      })
      if (collision.length > 0 && collision[0].id !== input.id) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `A page with slug "${nextSlug}" already exists for locale "${nextLocale}".`
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
    const pagesService = container.resolve<PagesModuleService>(PAGES_MODULE)
    await pagesService.updatePages({
      id: before.id,
      slug: before.slug,
      title: before.title,
      content: before.content,
      excerpt: before.excerpt,
      meta_title: before.meta_title,
      meta_description: before.meta_description,
      og_image_url: before.og_image_url,
      noindex: before.noindex,
      canonical_override: before.canonical_override,
      status: before.status,
      published_at: before.published_at,
      locale: before.locale,
      translation_group_id: before.translation_group_id,
    })
  }
)
