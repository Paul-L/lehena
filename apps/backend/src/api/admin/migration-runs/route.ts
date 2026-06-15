import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { MIGRATION_MODULE } from "../../../modules/migration"
import { runMigrationWorkflow } from "../../../workflows/migration/run-migration"

import {
  type CreateMigrationRunSchema,
  type ListMigrationRunsQuerySchema,
} from "./validators"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { limit, offset, script, status } =
    req.validatedQuery as ListMigrationRunsQuerySchema

  const take = limit ?? 20
  const skip = offset ?? 0

  const filters: Record<string, unknown> = {}
  if (script) filters.script = script
  if (status) filters.status = status

  const service = req.scope.resolve(MIGRATION_MODULE)
  const [rows, count] = await service.listAndCountMigrationRuns(filters, {
    take,
    skip,
    order: { created_at: "DESC" },
  })

  // Strip `entries` from list responses — they can be large and the
  // detail route returns them. Keep the row otherwise.
  const runs = rows.map((r) => {
    const { entries: _entries, ...rest } = r as typeof r & {
      entries: unknown
    }
    return rest
  })

  res.json({ runs, count, limit: take, offset: skip })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateMigrationRunSchema>,
  res: MedusaResponse
) {
  const { script, source, commit, limit } = req.validatedBody
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const service = req.scope.resolve(MIGRATION_MODULE)

  const triggeredBy = req.auth_context?.actor_id ?? null

  const created = await service.createMigrationRuns({
    script,
    source,
    dry_run: !commit,
    limit: limit ?? null,
    triggered_by: triggeredBy,
  })

  // Fire the workflow without awaiting so the request returns immediately.
  // The executeMigrationStep persists status + totals back to the row, so
  // the admin UI can poll GET /admin/migration-runs/:id for progress.
  runMigrationWorkflow(req.scope)
    .run({ input: { runId: created.id } })
    .catch((err) => {
      logger.error(
        `[admin/migration-runs] workflow failed for run=${created.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    })

  res.json({ run: created })
}
