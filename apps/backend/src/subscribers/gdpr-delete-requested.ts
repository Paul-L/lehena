import React from "react"

import AccountDeletionConfirmationEmail from "../emails/account-deletion-confirmation"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function gdprDeleteRequestedHandler({
  event,
  container,
}: SubscriberArgs<{ customer_id: string; email: string; token: string }>) {
  const { email, token } = event.data
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const url = `${storefrontUrl}/fr/account/data/delete-confirm?token=${encodeURIComponent(
    token
  )}`
  const { html, text } = await renderEmail(
    React.createElement(AccountDeletionConfirmationEmail, { confirm_url: url })
  )
  await sendEmail(container, {
    template: "account-deletion-confirmation",
    dedupe_key: `token:${token.slice(-32)}`,
    to: email,
    subject: "Confirmer la suppression de votre compte Lehena",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "gdpr.delete_requested",
}
