import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  addWishlistItemStep,
  type AddWishlistItemStepInput,
} from "./steps/add-wishlist-item"

export type AddWishlistItemInput = AddWishlistItemStepInput

export const addWishlistItemWorkflow = createWorkflow(
  "add-wishlist-item",
  function (input: AddWishlistItemInput) {
    const item = addWishlistItemStep(input)
    return new WorkflowResponse(item)
  }
)
