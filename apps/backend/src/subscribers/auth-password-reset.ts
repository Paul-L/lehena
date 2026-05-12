import React from "react"

import PasswordResetEmail from "../emails/password-reset"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Sends the password reset email when Medusa emits `auth.password_reset`.
 * Stubs to a console log when RESEND_API_KEY is missing (see email-sender).
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
  const { entity_id, actor_type, token } = event.data
  if (actor_type !== "customer") return

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const url = `${storefrontUrl}/fr/account/reset-password?email=${encodeURIComponent(
    entity_id
  )}&token=${encodeURIComponent(token)}`

  const { html, text } = await renderEmail(
    React.createElement(PasswordResetEmail, { reset_url: url })
  )
  await sendEmail(container, {
    template: "password-reset",
    // Token is in the URL itself; we dedupe on (template, token-tail) so
    // a redelivered event doesn't trigger a second send.
    dedupe_key: `token:${token.slice(-32)}`,
    to: entity_id,
    subject: "Réinitialisation de votre mot de passe",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
