import { Modules } from "@medusajs/framework/utils"
import React from "react"

import { renderEmail } from "../emails/render"
import SubscriptionWelcomeEmail from "../emails/subscription-welcome"
import { sendEmail } from "../modules/notifications/email-sender"
import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../modules/subscription"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function subscriptionCreatedHandler({
  event,
  container,
}: SubscriberArgs<{
  customer_id: string
  plan_id: string
  stripe_subscription_id: string
}>) {
  const { customer_id, plan_id } = event.data
  const customerService = container.resolve(Modules.CUSTOMER)
  const subService =
    container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
  const customer = await customerService.retrieveCustomer(customer_id)
  if (!customer?.email) return
  const plan = await subService.retrieveSubscriptionPlan(plan_id)
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const { html, text } = await renderEmail(
    React.createElement(SubscriptionWelcomeEmail, {
      customer_name: customer.first_name,
      plan_name: plan?.name ?? "Abonnement",
      storefront_url: storefrontUrl,
    })
  )
  await sendEmail(container, {
    template: "subscription-welcome",
    dedupe_key: `subscription:${event.data.stripe_subscription_id}:welcome`,
    to: customer.email,
    subject: "Votre abonnement Lehena est confirmé",
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "subscription.created",
}
