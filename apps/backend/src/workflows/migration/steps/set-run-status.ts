import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { MIGRATION_MODULE } from "../../../modules/migration"

import type { MigrationModuleService } from "../../../modules/migration"
import type { MigrationStatus } from "../../../modules/migration/models/migration-run"

interface SetRunStatusInput {
  runId: string
  status: MigrationStatus
  /** Set on transitions to running. */
  set_started_at?: boolean
  /** Set on transitions to completed/failed. */
  set_finished_at?: boolean
}

export const setRunStatusStep = createStep(
  "migration-set-run-status",
  async (input: SetRunStatusInput, { container }) => {
    const service = container.resolve<MigrationModuleService>(MIGRATION_MODULE)
    const now = new Date()
    await service.updateMigrationRuns({
      id: input.runId,
      status: input.status,
      ...(input.set_started_at ? { started_at: now } : {}),
      ...(input.set_finished_at ? { finished_at: now } : {}),
    })
    return new StepResponse({ runId: input.runId })
  }
)
