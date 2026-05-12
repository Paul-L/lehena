import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { sendEmail } from "../modules/notifications/email-sender"

import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Daily stock-low alert. Walks every variant, filters those with
 * `inventory_quantity < threshold` and `manage_inventory=true`, and emails
 * a digest to atelier@lehena.fr.
 *
 * Threshold is configurable via `STOCK_LOW_THRESHOLD` (default 5).
 * Recipient via `STOCK_ALERTS_TO` (default `atelier@lehena.fr`).
 * Empty list = no email — we don't spam the inbox.
 */
export default async function stockLowAlertJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const threshold = parseInt(process.env.STOCK_LOW_THRESHOLD ?? "5", 10)
  const recipient = process.env.STOCK_ALERTS_TO ?? "atelier@lehena.fr"

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "sku",
      "title",
      "manage_inventory",
      "inventory_items.required_quantity",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
      "product.title",
      "product.handle",
    ],
  })

  interface Row {
    id: string
    sku?: string | null
    title?: string | null
    manage_inventory?: boolean | null
    inventory_items?: {
      inventory?: {
        location_levels?: {
          stocked_quantity?: number | null
          reserved_quantity?: number | null
        }[]
      } | null
    }[]
    product?: { title?: string | null; handle?: string | null } | null
  }

  const lows: {
    sku: string
    title: string
    remaining: number
    product: string
  }[] = []
  for (const v of (variants ?? []) as Row[]) {
    if (!v.manage_inventory) continue
    // Sum stocked - reserved across all locations.
    let stocked = 0
    let reserved = 0
    for (const ii of v.inventory_items ?? []) {
      for (const ll of ii.inventory?.location_levels ?? []) {
        stocked += ll.stocked_quantity ?? 0
        reserved += ll.reserved_quantity ?? 0
      }
    }
    const remaining = stocked - reserved
    if (remaining < threshold) {
      lows.push({
        sku: v.sku ?? v.id,
        title: v.title ?? "Sans titre",
        remaining,
        product: v.product?.title ?? "?",
      })
    }
  }

  if (lows.length === 0) {
    logger.info(
      `[jobs/stock-low-alert] no variants below threshold ${threshold}`
    )
    return
  }

  const rows = lows
    .sort((a, b) => a.remaining - b.remaining)
    .map(
      (l) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e7e1d5"><strong>${escapeHtml(
          l.product
        )}</strong> — ${escapeHtml(l.title)} (SKU ${escapeHtml(
          l.sku
        )})</td><td style="padding:6px 12px;border-bottom:1px solid #e7e1d5;text-align:right;font-family:monospace">${l.remaining}</td></tr>`
    )
    .join("")
  const html = `
    <h2 style="font-family:Georgia,serif">Stock bas — ${lows.length} variante${
      lows.length > 1 ? "s" : ""
    }</h2>
    <p>Seuil : ${threshold} unités. À recharger en priorité :</p>
    <table style="border-collapse:collapse;width:100%;font-family:Georgia,serif;font-size:14px">${rows}</table>
  `
  await sendEmail(container, {
    template: "stock-low-alert",
    dedupe_key: `stock-low:${new Date().toISOString().slice(0, 10)}`,
    to: recipient,
    subject: `[Stock] ${lows.length} variante${lows.length > 1 ? "s" : ""} sous le seuil`,
    html,
    text: lows
      .map((l) => `- ${l.product} / ${l.title} (SKU ${l.sku}): ${l.remaining}`)
      .join("\n"),
  })
  logger.info(`[jobs/stock-low-alert] alerted on ${lows.length} variants`)
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const config = {
  name: "stock-low-alert",
  // Daily at 07:00 server time — atelier opens at 09:00, so the digest
  // is already in the inbox when the team starts the day.
  schedule: "0 7 * * *",
}
