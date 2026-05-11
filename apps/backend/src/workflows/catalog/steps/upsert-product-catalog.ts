import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { CATALOG_MODULE } from "../../../modules/catalog"

import type {
  ProductDetailsInput,
  VariantDetailsInput,
} from "../../../modules/catalog/types"

interface ProductWithVariants {
  id: string
  variants?: { id: string; sku?: string | null }[] | null
}

export interface UpsertProductCatalogInput {
  product: ProductWithVariants
  details: ProductDetailsInput
  variants: VariantDetailsInput[]
}

// Snapshot uses `unknown` for DB-shaped values we'll write back verbatim
// during compensation; we don't need to re-typecheck rows already in DB.
interface VariantSnapshot {
  variant_id: string
  variant_details_id: string
  is_new: boolean
  previous: { weight_grams: number; format: string } | null
}
interface Snapshot {
  product_details_id: string
  is_new_product_details: boolean
  previous_product_details: Record<string, unknown> | null
  variant_entries: VariantSnapshot[]
}

export const upsertProductCatalogStep = createStep(
  "upsert-product-catalog",
  async (input: UpsertProductCatalogInput, { container }) => {
    const catalog = container.resolve(CATALOG_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // ─── ProductDetails: upsert + link ───────────────────────────────
    const productGraph = await query.graph({
      entity: "product",
      fields: ["id", "product_details.*"],
      filters: { id: input.product.id },
    })
    const existingProductDetails = productGraph.data[0]?.product_details
    let productDetailsId: string
    let isNewProductDetails = false
    let previousProductDetails: Record<string, unknown> | null = null

    if (existingProductDetails?.id) {
      productDetailsId = existingProductDetails.id
      previousProductDetails = pickProductDetailsFields(
        existingProductDetails as Record<string, unknown>
      )
      await catalog.updateProductDetails({
        id: productDetailsId,
        ...input.details,
      })
    } else {
      const [created] = await catalog.createProductDetails([input.details])
      productDetailsId = created.id
      isNewProductDetails = true
      await link.create({
        [Modules.PRODUCT]: { product_id: input.product.id },
        [CATALOG_MODULE]: { product_details_id: productDetailsId },
      })
    }

    // ─── VariantDetails: match by SKU, upsert + link ─────────────────
    const variantEntries: Snapshot["variant_entries"] = []
    const productVariants = input.product.variants ?? []

    for (const variantInput of input.variants) {
      const matchingVariant = productVariants.find(
        (v) => v.sku && v.sku === variantInput.sku
      )
      if (!matchingVariant) {
        continue
      }

      const variantGraph = await query.graph({
        entity: "product_variant",
        fields: ["id", "variant_details.*"],
        filters: { id: matchingVariant.id },
      })
      const existing = variantGraph.data[0]?.variant_details
      const { sku: _sku, ...persisted } = variantInput
      void _sku

      if (existing?.id) {
        variantEntries.push({
          variant_id: matchingVariant.id,
          variant_details_id: existing.id,
          is_new: false,
          previous: {
            weight_grams: existing.weight_grams,
            format: existing.format,
          },
        })
        await catalog.updateVariantDetails({
          id: existing.id,
          ...persisted,
        })
      } else {
        const [createdVD] = await catalog.createVariantDetails([persisted])
        await link.create({
          [Modules.PRODUCT]: { product_variant_id: matchingVariant.id },
          [CATALOG_MODULE]: { variant_details_id: createdVD.id },
        })
        variantEntries.push({
          variant_id: matchingVariant.id,
          variant_details_id: createdVD.id,
          is_new: true,
          previous: null,
        })
      }
    }

    const snapshot: Snapshot = {
      product_details_id: productDetailsId,
      is_new_product_details: isNewProductDetails,
      previous_product_details: previousProductDetails,
      variant_entries: variantEntries,
    }
    return new StepResponse(snapshot, snapshot)
  },
  // ─── Compensation: undo the upsert on rollback ───────────────────────
  async (snapshot: Snapshot | undefined, { container }) => {
    if (!snapshot) {
      return
    }
    const catalog = container.resolve(CATALOG_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    // Roll back product details
    if (snapshot.is_new_product_details) {
      await catalog.deleteProductDetails(snapshot.product_details_id)
    } else if (snapshot.previous_product_details) {
      await catalog.updateProductDetails({
        id: snapshot.product_details_id,
        ...snapshot.previous_product_details,
      })
    }

    // Roll back variant details
    for (const entry of snapshot.variant_entries) {
      if (entry.is_new) {
        await link.dismiss({
          [Modules.PRODUCT]: { product_variant_id: entry.variant_id },
          [CATALOG_MODULE]: { variant_details_id: entry.variant_details_id },
        })
        await catalog.deleteVariantDetails(entry.variant_details_id)
      } else if (entry.previous) {
        await catalog.updateVariantDetails({
          id: entry.variant_details_id,
          weight_grams: entry.previous.weight_grams,
          format: entry.previous.format,
        })
      }
    }
  }
)

function pickProductDetailsFields(
  row: Record<string, unknown>
): Record<string, unknown> {
  const keys = [
    "aging_months",
    "origin",
    "breed",
    "allergens",
    "nitrite_free",
    "conservation_temp",
    "conservation_days_after_opening",
    "ddm_days",
    "cure_method",
    "nutritional",
    "ingredients",
    "terroir_story",
    "pairings_tags",
    "seo_title",
    "seo_description",
    "og_image_url",
    "noindex",
  ] as const
  const out: Record<string, unknown> = {}
  for (const k of keys) {
    out[k] = row[k]
  }
  return out
}
