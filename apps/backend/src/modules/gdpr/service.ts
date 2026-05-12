import { MedusaService } from "@medusajs/framework/utils"

import GdprLog from "./models/gdpr-log"

class GdprModuleService extends MedusaService({
  GdprLog,
}) {}

export default GdprModuleService
