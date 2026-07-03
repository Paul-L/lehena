import { Module } from "@medusajs/framework/utils"

import WishlistModuleService from "./service"

export const WISHLIST_MODULE = "wishlist"

// Ré-export du type pour permettre `resolve<WishlistModuleService>(WISHLIST_MODULE)`
// partout où on résout le service depuis un container.
export type { default as WishlistModuleService } from "./service"

export default Module(WISHLIST_MODULE, {
  service: WishlistModuleService,
})
