import { Module } from "@medusajs/framework/utils"

import NotificationsModuleService from "./service"

export const NOTIFICATIONS_MODULE = "notifications"

// Ré-export du type pour permettre `resolve<NotificationsModuleService>(NOTIFICATIONS_MODULE)`
// partout où on résout le service depuis un container.
export type { default as NotificationsModuleService } from "./service"

export default Module(NOTIFICATIONS_MODULE, {
  service: NotificationsModuleService,
})
