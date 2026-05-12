import { Module } from "@medusajs/framework/utils"

import GdprModuleService from "./service"

export const GDPR_MODULE = "gdpr"

export default Module(GDPR_MODULE, {
  service: GdprModuleService,
})
