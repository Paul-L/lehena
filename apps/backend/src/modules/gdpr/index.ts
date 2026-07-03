import { Module } from "@medusajs/framework/utils"

import GdprModuleService from "./service"

export const GDPR_MODULE = "gdpr"

// Ré-export du type pour permettre `resolve<GdprModuleService>(GDPR_MODULE)`
// partout où on résout le service depuis un container.
export type { default as GdprModuleService } from "./service"

export default Module(GDPR_MODULE, {
  service: GdprModuleService,
})
