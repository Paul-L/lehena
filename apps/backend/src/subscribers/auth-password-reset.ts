import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Stubs the password reset email until Phase 7 (Resend) is wired.
 *
 * Medusa's `generateResetPasswordTokenWorkflow` emits `auth.password_reset`
 * with the JWT token. Until Resend is wired, we log the full storefront URL
 * so QA can copy-paste it during testing.
 */
export default async function authPasswordResetHandler({
  event,
  container,
}: SubscriberArgs<{
  entity_id: string
  actor_type: string
  token: string
  metadata?: Record<string, unknown>
}>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { entity_id, actor_type, token } = event.data
  if (actor_type !== "customer") return

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  // Default to /fr — locale is purely cosmetic for the reset link.
  const url = `${storefrontUrl}/fr/account/reset-password?email=${encodeURIComponent(
    entity_id
  )}&token=${encodeURIComponent(token)}`

  logger.info(
    `[auth.password_reset] STUB email to ${entity_id} — open this link to reset:\n  ${url}`
  )
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
