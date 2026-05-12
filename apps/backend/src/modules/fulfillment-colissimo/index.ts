import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ColissimoFulfillmentService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ColissimoFulfillmentService],
})
