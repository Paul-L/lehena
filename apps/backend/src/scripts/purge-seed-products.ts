import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

import { parseArgs } from "../migration/source"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Removes the curated demo catalogue (seeded by `src/scripts/seed/products`)
 * so the real WooCommerce import (`migrate-products.ts --commit`) starts from a
 * clean slate. Product import is idempotent by `handle`: any seed product whose
 * handle collides with an incoming WC slug would otherwise be left untouched
 * (reported `skipped: handle already exists`), keeping stale demo data live.
 *
 * Targets ONLY the 16 known seed handles below — it never touches products
 * created by the migration (those carry `metadata.migrated_from=lehena-wp` and
 * have different WC-derived handles). Safe to run before or after a dry-run.
 *
 * Usage:
 *   medusa exec ./src/scripts/purge-seed-products.ts            # dry-run (lists)
 *   medusa exec ./src/scripts/purge-seed-products.ts -- --commit  # deletes
 */

// Handles of the curated demo products, as currently served by the store API.
// Source of truth: src/scripts/seed/products/data.ts.
const SEED_PRODUCT_HANDLES = [
  "jambon-orhi-24-mois",
  "jambon-orhi-18-mois",
  "jambon-orhi-15-mois",
  "selection-chef-jambon-orhi-24",
  "os-de-jambon",
  "ventreche-roulee",
  "ttipini-piment-espelette",
  "saucisses-mouton-piperade",
  "patxaran-traditionnel-50cl",
  "patxaran-reserve-70cl",
  "navarin-agneau-buru-beltza",
  "tajine-mouton-buru-beltza",
  "planche-jambon-bois",
  "support-jambon-metal",
  "couteau-jambon",
  "aerateur-vin-patxaran",
]

export default async function purgeSeedProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const args = parseArgs(process.argv.slice(2))
  const commit = "commit" in args

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "metadata"],
    filters: { handle: SEED_PRODUCT_HANDLES },
  })

  if (products.length === 0) {
    logger.info("[purge-seed-products] No seed products found — nothing to do.")
    return
  }

  // Guard: never delete anything the migration created.
  const migrated = products.filter(
    (p) => (p.metadata as Record<string, unknown> | null)?.migrated_from
  )
  const deletable = products.filter(
    (p) => !(p.metadata as Record<string, unknown> | null)?.migrated_from
  )

  for (const p of products) {
    const flag = (p.metadata as Record<string, unknown> | null)?.migrated_from
      ? "SKIP (migrated)"
      : commit
        ? "DELETE"
        : "would delete"
    logger.info(`[purge-seed-products] ${flag}: ${p.handle} — ${p.title}`)
  }

  if (migrated.length > 0) {
    logger.warn(
      `[purge-seed-products] ${migrated.length} product(s) carry metadata.migrated_from and are left untouched.`
    )
  }

  if (!commit) {
    logger.info(
      `[purge-seed-products] DRY-RUN — ${deletable.length} product(s) would be deleted. Re-run with --commit to apply.`
    )
    return
  }

  if (deletable.length === 0) {
    logger.info("[purge-seed-products] Nothing to delete after guards.")
    return
  }

  await deleteProductsWorkflow(container).run({
    input: { ids: deletable.map((p) => p.id) },
  })
  logger.info(
    `[purge-seed-products] Deleted ${deletable.length} seed product(s).`
  )
}
