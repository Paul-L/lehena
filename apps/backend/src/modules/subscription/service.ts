import { MedusaService } from "@medusajs/framework/utils"

import Subscription from "./models/subscription"
import SubscriptionEventLog from "./models/subscription-event-log"
import SubscriptionPlan from "./models/subscription-plan"

class SubscriptionModuleService extends MedusaService({
  SubscriptionPlan,
  Subscription,
  SubscriptionEventLog,
}) {}

export default SubscriptionModuleService
