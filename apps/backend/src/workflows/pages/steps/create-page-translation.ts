import crypto from "crypto"

import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { PAGES_MODULE } from "../../../modules/pages"
import {
  PAGE_RESERVED_SLUGS,
  PAGE_SLUG_REGEX,
} from "../../../modules/pages/types"

export interface CreatePageTranslationStepInput {
  source_id: string
  target_locale: string
  slug?: string
}

/**
 * Duplicates a Page into a new locale. If the source has no
 * translation_group_id yet, mint a fresh uuid and stamp it on both the
 * source and the new translation row so they're linked going forward.
 *
 * Slug defaults to `${source.slug}-${target_locale}` so it stays unique
 * per (slug, locale) without forcing the operator to pick one upfront.
 */
export const createPageTranslationStep = createStep(
  "create-page-translation",
  async (input: CreatePageTranslationStepInput, { container }) => {
    const pagesService = container.resolve(PAGES_MODULE)
    const source = await pagesService.retrievePage(input.source_id)

    if (source.locale === input.target_locale) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Source page is already in locale "${input.target_locale}".`
      )
    }

    const candidateSlug = input.slug ?? `${source.slug}-${input.target_locale}`
    if (!PAGE_SLUG_REGEX.test(candidateSlug)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid slug "${candidateSlug}".`
      )
    }
    if (
      PAGE_RESERVED_SLUGS.includes(
        candidateSlug as (typeof PAGE_RESERVED_SLUGS)[number]
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Slug "${candidateSlug}" is reserved.`
      )
    }

    const collision = await pagesService.listPages({
      slug: candidateSlug,
      locale: input.target_locale,
    })
    if (collision.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `A page with slug "${candidateSlug}" already exists for locale "${input.target_locale}".`
      )
    }

    const groupId = source.translation_group_id ?? crypto.randomUUID()

    // Backfill the source row's group id if it didn't have one yet, so the
    // pair is linked from this point forward.
    let sourceWasBackfilled = false
    if (!source.translation_group_id) {
      await pagesService.updatePages({
        id: source.id,
        translation_group_id: groupId,
      })
      sourceWasBackfilled = true
    }

    const translation = await pagesService.createPages({
      slug: candidateSlug,
      title: source.title,
      content: source.content,
      excerpt: source.excerpt,
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      og_image_url: source.og_image_url,
      noindex: source.noindex,
      canonical_override: source.canonical_override,
      locale: input.target_locale,
      translation_group_id: groupId,
      // Translation starts as a draft regardless of source status.
      status: "draft",
    })

    return new StepResponse(translation, {
      created_id: translation.id,
      source_id: source.id,
      source_was_backfilled: sourceWasBackfilled,
    })
  },
  async (compensationInput, { container }) => {
    if (!compensationInput) return
    const pagesService = container.resolve(PAGES_MODULE)
    await pagesService.deletePages(compensationInput.created_id)
    if (compensationInput.source_was_backfilled) {
      await pagesService.updatePages({
        id: compensationInput.source_id,
        translation_group_id: null,
      })
    }
  }
)
