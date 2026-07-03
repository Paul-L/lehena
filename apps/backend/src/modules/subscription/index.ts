import { Module } from "@medusajs/framework/utils"

import SubscriptionModuleService from "./service"

export const SUBSCRIPTION_MODULE = "subscription"

// Ré-export du type pour permettre `resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)`
// partout où on résout le service depuis un container.
export type { default as SubscriptionModuleService } from "./service"

export default Module(SUBSCRIPTION_MODULE, {
  service: SubscriptionModuleService,
})
