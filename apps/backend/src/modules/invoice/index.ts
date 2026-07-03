import { Module } from "@medusajs/framework/utils"

import InvoiceModuleService from "./service"

export const INVOICE_MODULE = "invoice"

// Ré-export du type pour permettre `resolve<InvoiceModuleService>(INVOICE_MODULE)`
// partout où on résout le service depuis un container.
export type { default as InvoiceModuleService } from "./service"

export default Module(INVOICE_MODULE, {
  service: InvoiceModuleService,
})
