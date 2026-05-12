import { Modules } from "@medusajs/framework/utils"
import React from "react"

import { renderEmail } from "../emails/render"
import SubscriptionPaymentFailedEmail from "../emails/subscription-payment-failed"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function subscriptionPaymentFailedHandler({
  event,
  container,
}: SubscriberArgs<{ subscription_id: string; customer_id: string }>) {
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(
    event.data.customer_id
  )
  if (!customer?.email) return
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const { html, text } = await renderEmail(
    React.createElement(SubscriptionPaymentFailedEmail, {
      customer_name: customer.first_name,
      storefront_url: storefrontUrl,
    })
  )
  await sendEmail(container, {
    template: "subscription-payment-failed",
    // One email per (subscription, calendar day) — Stripe retries up to
    // 3 times so we don't spam.
    dedupe_key: `subscription:${event.data.subscription_id}:payment-failed:${new Date()
      .toISOString()
      .slice(0, 10)}`,
    to: customer.email,
    subject: "Action requise — paiement de votre abonnement",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "subscription.payment_failed",
}
