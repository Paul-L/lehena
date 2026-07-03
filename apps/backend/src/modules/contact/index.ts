import { Module } from "@medusajs/framework/utils"

import ContactModuleService from "./service"

export const CONTACT_MODULE = "contact"

// Ré-export du type pour permettre `resolve<ContactModuleService>(CONTACT_MODULE)`
// partout où on résout le service depuis un container.
export type { default as ContactModuleService } from "./service"

export default Module(CONTACT_MODULE, {
  service: ContactModuleService,
})
