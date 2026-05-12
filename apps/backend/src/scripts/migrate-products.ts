import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { mapProduct } from "../migration/mappers/product"
import { ReportBuilder } from "../migration/report"
import { parseArgs, pickReader } from "../migration/source"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Migrates WooCommerce products into Medusa.
 *
 * Important — this script is intentionally **dry-run only in V1**: it
 * exercises the full mapper pipeline (categorisation, variants, product
 * details, redirects), writes a detailed report, but DOES NOT yet invoke
 * `createProductsWorkflow`. The reason: until we see the real Inovesign
 * export, we don't know which custom fields land where (sales channels,
 * region prices, image alt-text, brand association). Running --commit on
 * the wrong shape risks creating thousands of malformed products.
 *
 * Procedure at bascule (Phase 14):
 *   1. Run `--source=api` (or fixtures during staging rehearsals) to
 *      generate `migration-reports/migrate-products-...json`.
 *   2. Manual review of the report on a sample of 50 products.
 *   3. Wire the workflow call below (commented out) once the shape is
 *      validated, behind `--commit`.
 *
 * Usage:
 *   medusa exec ./src/scripts/migrate-products.ts [--source=api|fixtures] [--limit=N]
 */
export default async function migrateProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productService = container.resolve(Modules.PRODUCT)

  const args = parseArgs(process.argv.slice(2))
  const limit = args.limit ? parseInt(args.limit, 10) : Number.POSITIVE_INFINITY

  const reader = pickReader(args.source)
  if (!reader) {
    logger.error(
      "[migrate-products] No source. Set WC_API_URL+creds, or pass --source=fixtures."
    )
    return
  }

  const report = new ReportBuilder({
    script: "migrate-products",
    source: reader.name,
    dry_run: true,
  })
  logger.info(
    `[migrate-products] source=${reader.name} dryRun=true limit=${limit}`
  )

  let seen = 0
  for await (const legacy of reader.listProducts()) {
    if (seen >= limit) break
    seen++
    const mapped = mapProduct(legacy)
    if (mapped.variants.length === 0) {
      report.record({
        legacy_id: legacy.id,
        outcome: "skipped",
        notes: "no variants mapped",
      })
      continue
    }
    try {
      // Idempotence sentinel: if a Medusa product already exists for the
      // same handle, mark as `updated` (no-op in V1 dry-run).
      const existing = await productService.listProducts(
        { handle: mapped.handle },
        { take: 1 }
      )
      if (existing.length > 0) {
        report.record({
          legacy_id: legacy.id,
          outcome: "updated",
          medusa_id: existing[0].id,
          notes: `handle already exists — V1 dry-run skips`,
        })
        continue
      }
      report.record({
        legacy_id: legacy.id,
        outcome: "created",
        notes: `would create handle=${mapped.handle} category=${mapped.category_handle} variants=${mapped.variants.length}`,
      })
    } catch (err) {
      report.record({
        legacy_id: legacy.id,
        outcome: "failed",
        notes: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const { filepath, report: data } = await report.write()
  logger.info(
    `[migrate-products] done — seen=${data.totals.seen} created=${data.totals.created} updated=${data.totals.updated} skipped=${data.totals.skipped} failed=${data.totals.failed}`
  )
  logger.info(`[migrate-products] report → ${filepath}`)
}
