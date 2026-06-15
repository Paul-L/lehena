import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { executeMigrationStep } from "./steps/execute-migration"
import { setRunStatusStep } from "./steps/set-run-status"

interface RunMigrationInput {
  runId: string
}

/**
 * Orchestrates a single migration_run:
 *   1. mark as running (sets started_at)
 *   2. execute the script-specific runner; on completion or failure the
 *      step persists status + totals + entries back to the row
 *
 * The workflow is invoked WITHOUT awaiting from the admin API route so
 * the HTTP request returns immediately with the run id. CLI scripts can
 * await for synchronous behaviour.
 */
export const runMigrationWorkflow = createWorkflow(
  "run-migration",
  function (input: RunMigrationInput) {
    setRunStatusStep({
      runId: input.runId,
      status: "running",
      set_started_at: true,
    })
    const result = executeMigrationStep({ runId: input.runId })
    return new WorkflowResponse(result)
  }
)

export default runMigrationWorkflow
