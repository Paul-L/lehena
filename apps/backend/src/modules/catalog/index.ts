import { Module } from "@medusajs/framework/utils"

import CatalogModuleService from "./service"

export const CATALOG_MODULE = "catalog"

// Ré-export du type pour permettre `resolve<CatalogModuleService>(CATALOG_MODULE)`
// partout où on résout le service depuis un container.
export type { default as CatalogModuleService } from "./service"

export default Module(CATALOG_MODULE, {
  service: CatalogModuleService,
})
