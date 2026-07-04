// Danger — deletes ALL products (variants, prices, images, links included via
// the workflow). Use to re-seed product data from scratch: the seed skips
// products that already exist by handle, so their (possibly stale) image URLs
// never get rewritten. Wipe, then re-run `medusa exec ./src/scripts/seed.ts`.
//
// Guarded by CONFIRM_RESET_PRODUCTS=true so it can't fire by accident:
//   docker exec -e CONFIRM_RESET_PRODUCTS=true medusa-backend \
//     sh -c 'cd /app/apps/backend && pnpm exec medusa exec ./src/scripts/reset-products.ts'
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

import type { ExecArgs } from "@medusajs/framework/types"

export default async function resetProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (process.env.CONFIRM_RESET_PRODUCTS !== "true") {
    logger.warn(
      "[reset-products] Refusing to run without CONFIRM_RESET_PRODUCTS=true. Aborting."
    )
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
  })
  const ids = (products ?? []).map((p) => p.id)

  if (ids.length === 0) {
    logger.info("[reset-products] No products to delete.")
    return
  }

  await deleteProductsWorkflow(container).run({ input: { ids } })
  logger.info(`[reset-products] Deleted ${ids.length} products.`)
}
