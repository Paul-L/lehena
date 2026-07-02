import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { runCustomersMigration } from "../../../migration/runners/customers"
import { runMediaMigration } from "../../../migration/runners/media"
import { runProductsMigration } from "../../../migration/runners/products"
import { MIGRATION_MODULE } from "../../../modules/migration"

import type { MigrationModuleService } from "../../../modules/migration"
import type { MigrationStatus } from "../../../modules/migration/models/migration-run"

interface ExecuteMigrationInput {
  runId: string
}

/**
 * Reads the run config from the DB row, executes the matching runner, and
 * writes the totals + entries back. Errors are caught and persisted as
 * status=failed with the error message — the step itself does not throw,
 * so the workflow always completes cleanly.
 */
export const executeMigrationStep = createStep(
  "migration-execute",
  async (input: ExecuteMigrationInput, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const service = container.resolve<MigrationModuleService>(MIGRATION_MODULE)

    const row = await service.retrieveMigrationRun(input.runId)
    logger.info(
      `[migration-execute] runId=${row.id} script=${row.script} source=${row.source} dry_run=${row.dry_run}`
    )

    let status: MigrationStatus = "completed"
    let totals: Record<string, number> | null = null
    let entries: unknown[] | null = null
    let errorMessage: string | null = null

    try {
      const runnerOpts = {
        source: row.source,
        commit: !row.dry_run,
        limit: row.limit ?? undefined,
      }
      const result =
        row.script === "products"
          ? await runProductsMigration(container, runnerOpts)
          : row.script === "customers"
            ? await runCustomersMigration(container, runnerOpts)
            : await runMediaMigration(container, runnerOpts)
      totals = result.totals
      entries = result.entries
    } catch (err) {
      status = "failed"
      errorMessage = err instanceof Error ? err.message : String(err)
      logger.error(
        `[migration-execute] runId=${row.id} failed: ${errorMessage}`
      )
    }

    await service.updateMigrationRuns({
      id: row.id,
      status,
      // `entries` is a JSON column — Medusa types it as Record but stores
      // any JSON-serialisable value. We persist the array as-is.
      totals: totals as Record<string, unknown> | null,
      entries: entries as unknown as Record<string, unknown> | null,
      error_message: errorMessage,
      finished_at: new Date(),
    })

    return new StepResponse({ runId: row.id, status })
  }
)
