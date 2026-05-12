import { MedusaService } from "@medusajs/framework/utils"

import EmailSentLog from "./models/email-sent-log"

class NotificationsModuleService extends MedusaService({
  EmailSentLog,
}) {}

export default NotificationsModuleService
