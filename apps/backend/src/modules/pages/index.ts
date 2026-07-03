import { Module } from "@medusajs/framework/utils"

import PagesModuleService from "./service"

export const PAGES_MODULE = "pages"

// Ré-export du type pour permettre `resolve<PagesModuleService>(PAGES_MODULE)`
// partout où on résout le service depuis un container.
export type { default as PagesModuleService } from "./service"

export default Module(PAGES_MODULE, {
  service: PagesModuleService,
})
