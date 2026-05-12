import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Logs the magic-link URL until Resend is wired in Phase 7. The token is a
 * 15-minute JWT; the operator/QA copy-pastes the URL to test the flow.
 */
export default async function authMagicLinkHandler({
  event,
  container,
}: SubscriberArgs<{ email: string; customer_id: string; token: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { email, token } = event.data
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const url = `${storefrontUrl}/fr/account/magic-link/callback?token=${encodeURIComponent(
    token
  )}`
  logger.info(
    `[auth.magic_link_requested] STUB email to ${email} — open this link to sign in:\n  ${url}`
  )
}

export const config: SubscriberConfig = {
  event: "auth.magic_link_requested",
}
