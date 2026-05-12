import React from "react"

import MagicLinkEmail from "../emails/magic-link"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function authMagicLinkHandler({
  event,
  container,
}: SubscriberArgs<{ email: string; customer_id: string; token: string }>) {
  const { email, token } = event.data
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const url = `${storefrontUrl}/fr/account/magic-link/callback?token=${encodeURIComponent(
    token
  )}`
  const { html, text } = await renderEmail(
    React.createElement(MagicLinkEmail, { magic_url: url })
  )
  await sendEmail(container, {
    template: "magic-link",
    dedupe_key: `token:${token.slice(-32)}`,
    to: email,
    subject: "Votre lien de connexion Lehena",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "auth.magic_link_requested",
}
