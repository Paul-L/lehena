import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { upsertProductCatalogStep } from "./steps/upsert-product-catalog"

import type { UpsertProductCatalogInput } from "./steps/upsert-product-catalog"

// Single entry point used by workflow hooks (productsCreated / productsUpdated)
// and any future admin route that lets operators edit catalog details
// independently of the product itself.
export const upsertProductCatalogWorkflow = createWorkflow(
  "upsert-product-catalog",
  function (input: UpsertProductCatalogInput) {
    const result = upsertProductCatalogStep(input)
    return new WorkflowResponse(result)
  }
)

export default upsertProductCatalogWorkflow
