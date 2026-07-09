import React from "react"

import PasswordResetEmail from "../emails/password-reset"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Sends the password reset email when Medusa emits `auth.password_reset`.
 * Handles both actor types :
 *   - `customer` : lien vers le storefront `/fr/account/reset-password`
 *   - `user`     : lien vers l'admin backoffice `/app/reset-password`
 *     (déclenché depuis la page login de l'admin Medusa)
 *
 * Any other actor type is ignored to avoid sending emails on unrelated
 * password reset flows added later.
 *
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

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const backendUrl =
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
    "http://localhost:9000"

  let url: string
  let subject: string
  if (actor_type === "customer") {
    url = `${storefrontUrl}/fr/account/reset-password?email=${encodeURIComponent(
      entity_id
    )}&token=${encodeURIComponent(token)}`
    subject = "Réinitialisation de votre mot de passe"
  } else if (actor_type === "user") {
    // Admin backoffice reset — Medusa admin sert l'UI de reset sur
    // /app/reset-password et lit les query params `token` + `email`.
    url = `${backendUrl}/app/reset-password?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(entity_id)}`
    subject = "Réinitialisation de votre mot de passe (admin Lehena)"
  } else {
    return
  }

  const { html, text } = await renderEmail(
    React.createElement(PasswordResetEmail, { reset_url: url })
  )
  await sendEmail(container, {
    template: "password-reset",
    // Token is in the URL itself; we dedupe on (template, token-tail) so
    // a redelivered event doesn't trigger a second send. On préfixe par
    // actor_type pour ne pas confondre un token user avec un token customer
    // s'ils se terminent par les mêmes 32 chars.
    dedupe_key: `${actor_type}:${token.slice(-32)}`,
    to: entity_id,
    subject,
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
