import { ModuleProvider, Modules } from "@medusajs/framework/utils"

import ChronofreshFulfillmentService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ChronofreshFulfillmentService],
})
