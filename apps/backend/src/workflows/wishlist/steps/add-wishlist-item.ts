import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { WISHLIST_MODULE } from "../../../modules/wishlist"

export interface AddWishlistItemStepInput {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

export const addWishlistItemStep = createStep(
  "add-wishlist-item",
  async (input: AddWishlistItemStepInput, { container }) => {
    const service = container.resolve(WISHLIST_MODULE)
    const existing = await service.listWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
    })
    if (existing.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "Already in wishlist"
      )
    }
    const item = await service.createWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
    })
    return new StepResponse(item, item.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service = container.resolve(WISHLIST_MODULE)
    await service.deleteWishlistItems(id)
  }
)
