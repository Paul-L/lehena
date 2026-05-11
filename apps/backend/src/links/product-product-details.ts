import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import CatalogModule from "../modules/catalog"

// 1-1 link between the core Product and our Lehena ProductDetails.
// Order matters when calling link.create / dismiss — keep Product first.
export default defineLink(ProductModule.linkable.product, {
  linkable: CatalogModule.linkable.productDetails,
  deleteCascade: true,
})
