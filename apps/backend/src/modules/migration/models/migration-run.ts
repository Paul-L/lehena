import { model } from "@medusajs/framework/utils"

export const MIGRATION_SCRIPTS = ["products", "customers", "media"] as const
export type MigrationScript = (typeof MIGRATION_SCRIPTS)[number]

export const MIGRATION_SOURCES = ["api", "fixtures"] as const
export type MigrationSource = (typeof MIGRATION_SOURCES)[number]

export const MIGRATION_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const
export type MigrationStatus = (typeof MIGRATION_STATUSES)[number]

const MigrationRun = model.define("migration_run", {
  id: model.id().primaryKey(),
  script: model.enum(["products", "customers", "media"]),
  source: model.enum(["api", "fixtures"]),
  dry_run: model.boolean().default(true),
  /** Cap on rows processed. Null = no cap. */
  limit: model.number().nullable(),
  status: model
    .enum(["pending", "running", "completed", "failed"])
    .default("pending"),
  /** Tallies populated when the run finishes. Same shape as the JSON report. */
  totals: model.json().nullable(),
  /** Per-row outcomes. Loose-typed JSON, mirrors MigrationReportEntry. */
  entries: model.json().nullable(),
  /** Failure cause when status='failed'. */
  error_message: model.text().nullable(),
  /** Medusa workflow execution id — joins with the workflow tooling. */
  workflow_execution_id: model.text().nullable(),
  /** Admin user id who started the run; null for CLI invocations. */
  triggered_by: model.text().nullable(),
  started_at: model.dateTime().nullable(),
  finished_at: model.dateTime().nullable(),
})

export default MigrationRun
