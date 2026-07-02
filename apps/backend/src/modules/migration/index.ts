import { Module } from "@medusajs/framework/utils"

import MigrationModuleService from "./service"

export const MIGRATION_MODULE = "migration"

// Ré-export du type pour permettre `resolve<MigrationModuleService>(MIGRATION_MODULE)`
// partout où on résout le service depuis un container.
export type { default as MigrationModuleService } from "./service"

export default Module(MIGRATION_MODULE, {
  service: MigrationModuleService,
})
