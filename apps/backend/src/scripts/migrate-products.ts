import fs from "node:fs/promises"
import path from "node:path"

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { parseArgs } from "../migration/source"
import { MIGRATION_MODULE } from "../modules/migration"
import { runMigrationWorkflow } from "../workflows/migration/run-migration"

import type MigrationModuleService from "../modules/migration/service"
import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Migrates WooCommerce products into Medusa via the shared
 * `runMigrationWorkflow`. Creates a `migration_run` row tagged
 * `triggered_by=cli` and awaits the workflow; admin-triggered runs go
 * through the same workflow but without awaiting.
 *
 * Usage:
 *   medusa exec ./src/scripts/migrate-products.ts -- \
 *     [--source=api|fixtures] [--limit=N] [--commit]
 *
 * For backwards compatibility this still writes a JSON report to
 * `migration-reports/` after the run completes. The same data is also
 * available in the admin UI under the migration_runs page.
 */
export default async function migrateProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service = container.resolve<MigrationModuleService>(MIGRATION_MODULE)

  const args = parseArgs(process.argv.slice(2))
  const limit = args.limit ? parseInt(args.limit, 10) : null
  const commit = "commit" in args
  const source: "api" | "fixtures" =
    args.source === "fixtures" ? "fixtures" : "api"

  const created = await service.createMigrationRuns({
    script: "products",
    source,
    dry_run: !commit,
    limit,
    triggered_by: "cli",
  })
  logger.info(
    `[migrate-products] run=${created.id} source=${source} commit=${commit} limit=${limit ?? "∞"}`
  )

  await runMigrationWorkflow(container).run({ input: { runId: created.id } })

  const final = await service.retrieveMigrationRun(created.id)
  const t = (final.totals as Record<string, number> | null) ?? {
    seen: 0,
    created: 0,
    skipped: 0,
    failed: 0,
  }
  logger.info(
    `[migrate-products] done status=${final.status} seen=${t.seen} created=${t.created} skipped=${t.skipped} failed=${t.failed}`
  )
  if (final.error_message) {
    logger.error(`[migrate-products] error: ${final.error_message}`)
  }

  await writeReport(final)
}

type MigrationRunSnapshot = Awaited<
  ReturnType<MigrationModuleService["retrieveMigrationRun"]>
>

async function writeReport(row: MigrationRunSnapshot): Promise<void> {
  const dir = path.resolve(process.cwd(), "migration-reports")
  await fs.mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `migration-report-products-${stamp}${row.dry_run ? "-dryrun" : ""}.json`
  await fs.writeFile(
    path.join(dir, filename),
    JSON.stringify(
      {
        run_id: row.id,
        script: row.script,
        source: row.source,
        dry_run: row.dry_run,
        status: row.status,
        started_at: row.started_at,
        finished_at: row.finished_at,
        totals: row.totals,
        entries: row.entries,
        error_message: row.error_message,
      },
      null,
      2
    )
  )
}
