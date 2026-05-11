import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

import { CatalogAdditionalDataSchema } from "../../modules/catalog/types"
import { upsertProductCatalogWorkflow } from "../catalog/upsert-product-catalog"

// Mirror of products-created-catalog.ts but for updates. Admin product
// edits pass `additional_data.catalog` to refresh ProductDetails /
// VariantDetails. Missing additional_data is treated as "leave catalog as-is".
updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    const catalogData = (additional_data as { catalog?: unknown } | undefined)
      ?.catalog
    if (!catalogData) {
      return
    }

    const parsed = CatalogAdditionalDataSchema.safeParse(catalogData)
    if (!parsed.success) {
      const logger = container.resolve("logger")
      logger.warn(
        `[catalog hook:productsUpdated] invalid additional_data.catalog: ${parsed.error.message}`
      )
      return
    }

    for (const product of products) {
      await upsertProductCatalogWorkflow(container).run({
        input: {
          product: {
            id: product.id,
            variants: product.variants?.map((v) => ({
              id: v.id,
              sku: v.sku,
            })),
          },
          details: parsed.data.product,
          variants: parsed.data.variants,
        },
      })
    }
  }
)
