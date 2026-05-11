import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

import { CatalogAdditionalDataSchema } from "../../modules/catalog/types"
import { upsertProductCatalogWorkflow } from "../catalog/upsert-product-catalog"

// Fired after the core createProductsWorkflow has created the products
// (and their variants). When the caller attached `additional_data.catalog`,
// we materialize ProductDetails + VariantDetails records and link them.
//
// Compensation is delegated to the underlying upsertProductCatalogWorkflow.
createProductsWorkflow.hooks.productsCreated(
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
        `[catalog hook:productsCreated] invalid additional_data.catalog: ${parsed.error.message}`
      )
      return
    }

    // additional_data is per-call, applied to every product in the batch.
    // Seed and admin create products one at a time, so this matches reality.
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
