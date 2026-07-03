import { Module } from "@medusajs/framework/utils"

import RedirectsModuleService from "./service"

export const REDIRECTS_MODULE = "redirects"

// Ré-export du type pour permettre `resolve<RedirectsModuleService>(REDIRECTS_MODULE)`
// partout où on résout le service depuis un container.
export type { default as RedirectsModuleService } from "./service"

export default Module(REDIRECTS_MODULE, {
  service: RedirectsModuleService,
})
