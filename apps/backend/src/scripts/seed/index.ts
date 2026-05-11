import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { seedFulfillment } from "./fulfillment"
import { seedRegions } from "./regions"
import { seedStore } from "./store"

import type { ExecArgs } from "@medusajs/framework/types"

// Orchestrator for Phase 1 base data.
// Catalog seed (categories + 30 products) is added in sub-passes D and E.
export default async function seedLehena({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("=== Lehena seed ===")

  const store = await seedStore(container)
  const regions = await seedRegions(container)
  const fulfillment = await seedFulfillment(container, {
    storeId: store.storeId,
    defaultSalesChannelId: store.defaultSalesChannelId,
  })

  logger.info("=== Lehena seed done ===")
  logger.info(
    `Publishable key id: ${store.publishableApiKeyId}  ` +
      `regions: fr=${regions.fr.id} eu=${regions.eu.id} world=${regions.world.id}  ` +
      `profiles: fresh=${fulfillment.shippingProfiles.fresh.id} ambient=${fulfillment.shippingProfiles.ambient.id}`
  )
}
