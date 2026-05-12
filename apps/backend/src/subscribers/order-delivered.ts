import { Modules } from "@medusajs/framework/utils"
import React from "react"

import OrderDeliveredEmail from "../emails/order-delivered"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Sends the post-delivery email. In V1 there is no direct "delivered" event
 * from carrier webhooks (Chronofresh/Colissimo APIs aren't wired). Ops can
 * manually mark a shipment delivered in the admin to trigger
 * `delivery.created` — at which point this subscriber fires.
 */
export default async function orderDeliveredHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id?: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const orderId = event.data.order_id ?? event.data.id
  const order = await orderService.retrieveOrder(orderId, {
    relations: ["shipping_address"],
  })
  if (!order?.email) return

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
  const { html, text } = await renderEmail(
    React.createElement(OrderDeliveredEmail, {
      customer_name: order.shipping_address?.first_name ?? null,
      order_display_id: order.display_id ?? order.id,
      storefront_url: storefrontUrl,
    })
  )
  await sendEmail(container, {
    template: "order-delivered",
    dedupe_key: `order-delivered:${order.id}`,
    to: order.email,
    subject: `Votre commande #${order.display_id ?? order.id} est arrivée`,
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}
