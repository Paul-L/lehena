import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { MIGRATION_MODULE } from "../../../../modules/migration"

import { type SaveWcCredentialsSchema } from "./validators"

import type { MigrationModuleService } from "../../../../modules/migration"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve<MigrationModuleService>(MIGRATION_MODULE)
  const credentials = await service.getWcCredentialsPublic()
  res.json({ credentials })
}

export async function POST(
  req: AuthenticatedMedusaRequest<SaveWcCredentialsSchema>,
  res: MedusaResponse
) {
  const service = req.scope.resolve<MigrationModuleService>(MIGRATION_MODULE)
  try {
    const credentials = await service.saveWcCredentials(req.validatedBody)
    res.json({ credentials })
  } catch (err) {
    if (err instanceof MedusaError) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message)
  }
}
