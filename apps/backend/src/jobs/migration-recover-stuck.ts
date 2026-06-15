import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MIGRATION_MODULE } from "../modules/migration"

import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Recovers `migration_run` rows stuck in `status=running`. If the medusa
 * process died mid-workflow, the executeMigrationStep never gets to
 * write the final status — so on the next minute we mark anything that
 * has been "running" for more than 10 minutes as `failed`.
 *
 * 10 minutes is conservative; the products migration on a real WC store
 * with ~1000 products takes 2–5 minutes. Bump `STUCK_RUN_TIMEOUT_MS` if
 * the future customer/media runs trend longer.
 */
const STUCK_RUN_TIMEOUT_MS = 10 * 60 * 1000

export default async function recoverStuckMigrationRuns(
  container: MedusaContainer
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Migration module is env-gated (ENABLE_MIGRATION_MODULE). When disabled,
  // the service is not registered — short-circuit instead of crashing the
  // scheduler every minute.
  if (process.env.ENABLE_MIGRATION_MODULE !== "true") return

  const service = container.resolve(MIGRATION_MODULE)

  const cutoff = new Date(Date.now() - STUCK_RUN_TIMEOUT_MS)
  const stuck = await service.listMigrationRuns({
    status: "running",
    started_at: { $lt: cutoff },
  })

  if (stuck.length === 0) return

  logger.warn(
    `[migration-recover-stuck] marking ${stuck.length} run(s) as failed (started before ${cutoff.toISOString()})`
  )
  for (const run of stuck) {
    await service.updateMigrationRuns({
      id: run.id,
      status: "failed",
      error_message:
        "Run timed out — process likely crashed or restarted mid-execution.",
      finished_at: new Date(),
    })
  }
}

export const config = {
  name: "migration-recover-stuck",
  // Every minute. Cheap query, idempotent — no concern about overlap.
  schedule: "* * * * *",
}
