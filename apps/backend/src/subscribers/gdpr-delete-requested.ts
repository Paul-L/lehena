import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Logs the deletion-confirmation URL until Resend is wired in Phase 7. The
 * token is a 1-hour single-purpose JWT; the customer clicks the link in
 * their email to confirm the irreversible anonymisation.
 */
export default async function gdprDeleteRequestedHandler({
  event,
  container,
}: SubscriberArgs<{ customer_id: string; email: string; token: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { email, token } = event.data
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const url = `${storefrontUrl}/fr/account/data/delete-confirm?token=${encodeURIComponent(
    token
  )}`
  logger.info(
    `[gdpr.delete_requested] STUB email to ${email} — open this link to confirm deletion:\n  ${url}`
  )
}

export const config: SubscriberConfig = {
  event: "gdpr.delete_requested",
}
