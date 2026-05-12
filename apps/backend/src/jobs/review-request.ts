import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import React from "react"

import { renderEmail } from "../emails/render"
import ReviewRequestEmail from "../emails/review-request"
import { sendEmail } from "../modules/notifications/email-sender"

import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Daily cron that asks customers to leave a review ~10 days after their
 * order was delivered. We scan deliveries (or shipped orders, as a
 * fallback) in the [11 days ago, 10 days ago] window and dispatch the
 * email — idempotent via `email_sent_log(template, dedupe_key)`.
 *
 * The "review form" doesn't exist yet (Phase 10 module). For now the CTA
 * lands on `/account/orders/details/{id}` so the customer can already see
 * their order; the in-app form lands later and the CTA can stay as-is.
 */
export default async function reviewRequestJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customerService = container.resolve(Modules.CUSTOMER)

  const DAY = 24 * 60 * 60 * 1000
  const now = Date.now()
  const from = new Date(now - 11 * DAY)
  const to = new Date(now - 10 * DAY)

  // Pull recent orders + their fulfillments and filter in-memory. The
  // joined-entity filter shape (`fulfillments.shipped_at`) isn't typed in
  // v2.15's query.graph, so we keep the SQL fan-out client-side. Daily
  // cron + low volume make this comfortable.
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "fulfillments.shipped_at"],
    filters: {
      created_at: { $gte: new Date(now - 20 * DAY) },
    },
  })
  const orderIds = (orders ?? [])
    .filter((o) => {
      const fls = (
        o as { fulfillments?: { shipped_at?: string | Date | null }[] }
      ).fulfillments
      return (fls ?? []).some((f) => {
        if (!f.shipped_at) return false
        const t = new Date(f.shipped_at).getTime()
        return t >= from.getTime() && t < to.getTime()
      })
    })
    .map((o) => o.id as string)
  if (orderIds.length === 0) {
    logger.info(`[jobs/review-request] no shipments in window`)
    return
  }

  const orderService = container.resolve(Modules.ORDER)
  let sent = 0
  let skipped = 0
  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

  for (const orderId of orderIds) {
    try {
      const order = await orderService.retrieveOrder(orderId, {
        relations: ["shipping_address"],
      })
      if (!order?.email) {
        skipped++
        continue
      }
      // Respect marketing opt-out on the linked customer.
      if (order.customer_id) {
        try {
          const c = await customerService.retrieveCustomer(
            order.customer_id as string
          )
          const md = (c.metadata as Record<string, unknown> | null) ?? {}
          if (md.newsletter_marketing === false) {
            skipped++
            continue
          }
        } catch {
          /* best-effort */
        }
      }
      const { html, text } = await renderEmail(
        React.createElement(ReviewRequestEmail, {
          customer_name: order.shipping_address?.first_name ?? null,
          order_display_id: order.display_id ?? order.id,
          storefront_url: storefrontUrl,
        })
      )
      const res = await sendEmail(container, {
        template: "review-request",
        dedupe_key: `order:${order.id}:review-request`,
        to: order.email,
        subject: "Votre avis nous aide énormément",
        html,
        text,
      })
      if (res.status === "sent") sent++
      else skipped++
    } catch (err) {
      logger.error(
        `[jobs/review-request] failed order=${orderId}: ${
          err instanceof Error ? err.message : err
        }`
      )
      skipped++
    }
  }

  logger.info(`[jobs/review-request] sent=${sent} skipped=${skipped}`)
}

export const config = {
  name: "review-request-emails",
  // Daily at 10:00. After the abandoned-cart cron at 09:00 so we don't
  // burst Resend at the top of the hour.
  schedule: "0 10 * * *",
}
