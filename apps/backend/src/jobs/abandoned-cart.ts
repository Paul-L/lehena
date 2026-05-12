import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import React from "react"

import AbandonedCartEmail from "../emails/abandoned-cart"
import { renderEmail } from "../emails/render"
import { signPreferencesToken } from "../lib/preferences-token"
import { sendEmail } from "../modules/notifications/email-sender"

import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Scans for carts that have been idle for ~24h (J+1) or ~72h (J+3) without a
 * completed order, the customer has a known email, and they haven't opted
 * out of marketing. Sends the abandoned-cart reminder email — idempotent
 * via `email_sent_log(template, dedupe_key)`.
 *
 * Runs daily at 09:00 server time. Both J+1 and J+3 stages are handled in
 * one pass so we don't multiply cron entries.
 */
export default async function abandonedCartJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customerService = container.resolve(Modules.CUSTOMER)

  const storefrontUrl =
    process.env.STOREFRONT_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

  // Two windows: [25h ago, 23h ago] for J+1 and [73h ago, 71h ago] for J+3.
  // We use a 2-hour window so a daily cron is guaranteed to catch every
  // cart at each stage without missing or double-sending.
  const HOUR = 60 * 60 * 1000
  const now = Date.now()
  const windows: {
    stage: "J+1" | "J+3"
    from: Date
    to: Date
  }[] = [
    {
      stage: "J+1",
      from: new Date(now - 25 * HOUR),
      to: new Date(now - 23 * HOUR),
    },
    {
      stage: "J+3",
      from: new Date(now - 73 * HOUR),
      to: new Date(now - 71 * HOUR),
    },
  ]

  let sent = 0
  let skipped = 0

  for (const win of windows) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "customer_id",
        "updated_at",
        "completed_at",
        "items.title",
        "items.product_title",
        "items.thumbnail",
      ],
      filters: {
        updated_at: { $gte: win.from, $lt: win.to },
        completed_at: null,
      },
    })

    for (const cart of carts ?? []) {
      const email = (cart.email as string | null | undefined) ?? null
      if (!email) {
        skipped++
        continue
      }
      // Respect marketing opt-out on the linked customer (if any).
      if (cart.customer_id) {
        try {
          const c = await customerService.retrieveCustomer(
            cart.customer_id as string
          )
          const md = (c.metadata as Record<string, unknown> | null) ?? {}
          if (md.newsletter_marketing === false) {
            skipped++
            continue
          }
        } catch {
          /* customer fetch race — proceed best-effort */
        }
      }

      const items =
        (cart.items as
          | {
              title?: string | null
              product_title?: string | null
              thumbnail?: string | null
            }[]
          | null) ?? []
      const visibleItems = items.slice(0, 3).map((it) => ({
        title: it.product_title || it.title || "Produit",
        thumbnail: it.thumbnail ?? null,
      }))

      const unsubscribeUrl = `${storefrontUrl}/fr/preferences?token=${encodeURIComponent(
        signPreferencesToken(email)
      )}`
      const cartUrl = `${storefrontUrl}/fr/cart?recover=${encodeURIComponent(
        cart.id as string
      )}`

      const { html, text } = await renderEmail(
        React.createElement(AbandonedCartEmail, {
          customer_name: null,
          reminder_stage: win.stage,
          items: visibleItems,
          cart_url: cartUrl,
          unsubscribe_url: unsubscribeUrl,
        })
      )
      const result = await sendEmail(container, {
        template: "abandoned-cart",
        // Distinct key per stage so J+1 and J+3 are independent — the
        // dedupe table prevents two J+1 sends but still allows the J+3
        // follow-up later.
        dedupe_key: `cart:${cart.id}:${win.stage}`,
        to: email,
        subject:
          win.stage === "J+1"
            ? "Votre panier vous attend chez Lehena"
            : "Dernier rappel — votre panier Lehena",
        html,
        text,
      })
      if (result.status === "sent") sent++
      else skipped++
    }
  }

  logger.info(`[jobs/abandoned-cart] sent=${sent} skipped=${skipped}`)
}

export const config = {
  name: "abandoned-cart-emails",
  // Daily at 09:00 server time. Adjust schedule if Brevo / send rate
  // sensitivity changes in production.
  schedule: "0 9 * * *",
}
