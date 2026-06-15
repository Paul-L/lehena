import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { MIGRATION_MODULE } from "../../../../modules/migration"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  const service = req.scope.resolve(MIGRATION_MODULE)
  try {
    const run = await service.retrieveMigrationRun(id)
    res.json({ run })
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `migration_run ${id} not found`
    )
  }
}
