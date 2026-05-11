import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import CatalogModule from "../modules/catalog"

// 1-1 link between the core ProductVariant and our Lehena VariantDetails.
// Order matters — keep ProductVariant first.
export default defineLink(ProductModule.linkable.productVariant, {
  linkable: CatalogModule.linkable.variantDetails,
  deleteCascade: true,
})
