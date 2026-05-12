import { Modules } from "@medusajs/framework/utils"
import React from "react"

import OrderShippedEmail from "../emails/order-shipped"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

const CARRIER_LABEL: Record<string, string> = {
  chronofresh_chronofresh: "Chronofresh",
  colissimo_colissimo: "Colissimo",
  manual_manual: "expédition",
}

/**
 * Sends the shipping notification when Medusa's shipment workflow fires
 * `shipment.created` (the canonical Medusa v2 event for "the order has
 * physically left the warehouse").
 */
export default async function orderShippedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  const order = await orderService.retrieveOrder(event.data.id, {
    relations: ["shipping_address"],
  })
  if (!order?.email) return

  // Resolve the latest fulfillment for tracking metadata.
  const fulfillments = await fulfillmentService.listFulfillments(
    { provider_id: { $not: null } },
    { take: 5, order: { created_at: "DESC" } }
  )
  const fulfillment = fulfillments[0]
  const carrierId = (fulfillment?.provider_id as string | undefined) ?? ""
  const trackingNumber =
    (fulfillment?.labels?.[0]?.tracking_number as string | undefined) ?? null
  const trackingUrl =
    (fulfillment?.labels?.[0]?.tracking_url as string | undefined) ?? null

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

  const { html, text } = await renderEmail(
    React.createElement(OrderShippedEmail, {
      customer_name: order.shipping_address?.first_name ?? null,
      order_display_id: order.display_id ?? order.id,
      carrier: CARRIER_LABEL[carrierId] ?? "transporteur",
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      storefront_url: storefrontUrl,
    })
  )
  await sendEmail(container, {
    template: "order-shipped",
    dedupe_key: `order-shipped:${order.id}`,
    to: order.email,
    subject: `Commande #${order.display_id ?? order.id} expédiée`,
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
