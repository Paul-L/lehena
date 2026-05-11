import { MedusaService } from "@medusajs/framework/utils"

import ProductDetails from "./models/product-details"
import VariantDetails from "./models/variant-details"

class CatalogModuleService extends MedusaService({
  ProductDetails,
  VariantDetails,
}) {}

export default CatalogModuleService
