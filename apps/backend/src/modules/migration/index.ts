import { Module } from "@medusajs/framework/utils"

import MigrationModuleService from "./service"

export const MIGRATION_MODULE = "migration"

export default Module(MIGRATION_MODULE, {
  service: MigrationModuleService,
})
