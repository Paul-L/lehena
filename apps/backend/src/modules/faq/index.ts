import { Module } from "@medusajs/framework/utils"

import FaqModuleService from "./service"

export const FAQ_MODULE = "faq"

// Ré-export du type pour permettre `resolve<FaqModuleService>(FAQ_MODULE)`
// partout où on résout le service depuis un container.
export type { default as FaqModuleService } from "./service"

export default Module(FAQ_MODULE, {
  service: FaqModuleService,
})
