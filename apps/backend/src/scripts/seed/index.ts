import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { seedCategories } from "./categories"
import { seedFulfillment } from "./fulfillment"
import { seedProducts } from "./products"
import { seedRegions } from "./regions"
import { seedStore } from "./store"

import type { ExecArgs } from "@medusajs/framework/types"

// Phase 1 Lehena seed orchestrator.
export default async function seedLehena({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("=== Lehena seed ===")

  const store = await seedStore(container)
  const regions = await seedRegions(container)
  const fulfillment = await seedFulfillment(container, {
    storeId: store.storeId,
    defaultSalesChannelId: store.defaultSalesChannelId,
  })
  await seedCategories(container)
  const products = await seedProducts(container, {
    defaultSalesChannelId: store.defaultSalesChannelId,
    stockLocationId: fulfillment.locationId,
    productTypeIds: regions.productTypeIds,
    shippingProfileIds: {
      fresh: fulfillment.shippingProfiles.fresh.id,
      ambient: fulfillment.shippingProfiles.ambient.id,
    },
  })

  logger.info("=== Lehena seed done ===")
  logger.info(
    `Publishable key id: ${store.publishableApiKeyId}  ` +
      `regions: fr=${regions.fr.id} eu=${regions.eu.id} world=${regions.world.id}  ` +
      `profiles: fresh=${fulfillment.shippingProfiles.fresh.id} ambient=${fulfillment.shippingProfiles.ambient.id}  ` +
      `products: ${products.created} created / ${products.skipped} skipped`
  )
}
