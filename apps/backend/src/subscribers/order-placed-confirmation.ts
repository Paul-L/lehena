import { Modules } from "@medusajs/framework/utils"
import React from "react"

import OrderConfirmationEmail from "../emails/order-confirmation"
import { renderEmail } from "../emails/render"
import { sendEmail } from "../modules/notifications/email-sender"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedConfirmationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  const order = await orderService.retrieveOrder(event.data.id, {
    relations: ["items", "shipping_address", "billing_address"],
  })
  if (!order?.email) return

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

  const { html, text } = await renderEmail(
    React.createElement(OrderConfirmationEmail, {
      customer_name: order.shipping_address?.first_name ?? null,
      order_display_id: order.display_id ?? order.id,
      storefront_url: storefrontUrl,
      items: (order.items ?? []).map((it) => ({
        title: it.product_title || it.title || "Produit",
        quantity: Number(it.quantity ?? 1),
        total: Number(it.subtotal ?? 0),
      })),
      subtotal: Number(order.item_subtotal ?? order.subtotal ?? 0),
      shipping_total: Number(order.shipping_subtotal ?? 0),
      tax_total: Number(order.tax_total ?? 0),
      total: Number(order.total ?? 0),
      currency_code: order.currency_code ?? "eur",
      shipping_eta: null,
      tracking_url: null,
    })
  )
  await sendEmail(container, {
    template: "order-confirmation",
    dedupe_key: `order:${order.id}`,
    to: order.email,
    subject: `Commande #${order.display_id ?? order.id} confirmée`,
    html,
    text,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
