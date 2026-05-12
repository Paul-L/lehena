import { MedusaService } from "@medusajs/framework/utils"

import Author from "./models/author"

class AuthorModuleService extends MedusaService({
  Author,
}) {}

export default AuthorModuleService
