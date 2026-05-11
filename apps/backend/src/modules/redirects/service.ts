import { MedusaService } from "@medusajs/framework/utils"

import HandleSnapshot from "./models/handle-snapshot"
import Redirect from "./models/redirect"

class RedirectsModuleService extends MedusaService({
  Redirect,
  HandleSnapshot,
}) {}

export default RedirectsModuleService
