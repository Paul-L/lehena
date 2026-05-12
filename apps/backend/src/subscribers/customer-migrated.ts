import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import React from "react"

import MigrationWelcomeEmail from "../emails/migration-welcome"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Fires when the migration script emits `customer.migrated`. Sends the
 * legacy customer a long-lived (30 days) password-reset link wrapped in
 * the Lehena migration template.
 *
 * The token shape mirrors the one Medusa's `generateResetPasswordToken`
 * workflow emits so the existing `/account/reset-password` route can
 * consume it directly — no special-case storefront handling needed.
 */
export default async function customerMigratedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; email: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    logger.error(
      "[customer.migrated] JWT_SECRET missing — cannot issue reset token."
    )
    return
  }
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(event.data.id)
  if (!customer?.email) return

  const token = generateJwtToken(
    {
      entity_id: customer.email,
      provider: "emailpass",
      actor_type: "customer",
    },
    { secret, expiresIn: "30d" }
  )
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const resetUrl = `${storefrontUrl}/fr/account/reset-password?email=${encodeURIComponent(
    customer.email
  )}&token=${encodeURIComponent(token)}`

  const { html, text } = await renderEmail(
    React.createElement(MigrationWelcomeEmail, {
      first_name: customer.first_name,
      reset_url: resetUrl,
    })
  )
  await sendEmail(container, {
    template: "migration-welcome",
    dedupe_key: `migration:${customer.id}`,
    to: customer.email,
    subject: "Votre compte Lehena vous attend",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "customer.migrated",
}
