import { Module } from "@medusajs/framework/utils"

import ReviewModuleService from "./service"

export const REVIEW_MODULE = "review"

// Ré-export du type pour permettre `resolve<ReviewModuleService>(REVIEW_MODULE)`
// partout où on résout le service depuis un container.
export type { default as ReviewModuleService } from "./service"

export default Module(REVIEW_MODULE, {
  service: ReviewModuleService,
})
