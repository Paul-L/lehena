import { Modules } from "@medusajs/framework/utils"
import React from "react"

import { renderEmail } from "../emails/render"
import WelcomeEmail from "../emails/welcome"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function customerCreatedWelcomeHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(event.data.id)
  if (!customer?.email) return

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

  const { html, text } = await renderEmail(
    React.createElement(WelcomeEmail, {
      first_name: customer.first_name,
      storefront_url: storefrontUrl,
    })
  )
  await sendEmail(container, {
    template: "welcome",
    dedupe_key: `customer:${customer.id}`,
    to: customer.email,
    subject: "Bienvenue chez Maison Lehena",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
