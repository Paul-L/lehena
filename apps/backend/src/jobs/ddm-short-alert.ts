import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { sendEmail } from "../modules/notifications/email-sender"

import type { MedusaContainer } from "@medusajs/framework/types"

/**
 * Daily DDM-short alert. Walks the catalog's `product_details` rows and
 * surfaces every product whose `ddm_days` is below the configured
 * threshold (default 30). Emails a digest to atelier@lehena.fr so the
 * team can prioritise outbound shipments / discounts.
 */
export default async function ddmShortAlertJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const threshold = parseInt(process.env.DDM_SHORT_THRESHOLD ?? "30", 10)
  const recipient = process.env.STOCK_ALERTS_TO ?? "atelier@lehena.fr"

  // product_details lives in the catalog module — query via cross-module.
  const { data: details } = await query.graph({
    entity: "product_details",
    fields: ["id", "ddm_days", "product_handle", "product_title"],
    filters: { ddm_days: { $ne: null, $lt: threshold } },
  })

  interface Row {
    id: string
    ddm_days: number
    product_handle?: string | null
    product_title?: string | null
  }
  const flagged = (details ?? []) as Row[]
  if (flagged.length === 0) {
    logger.info(
      `[jobs/ddm-short-alert] no products with ddm_days < ${threshold}`
    )
    return
  }

  const rows = flagged
    .sort((a, b) => a.ddm_days - b.ddm_days)
    .map(
      (d) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #e7e1d5"><strong>${escapeHtml(
          d.product_title ?? "?"
        )}</strong> (<code>${escapeHtml(
          d.product_handle ?? "?"
        )}</code>)</td><td style="padding:6px 12px;border-bottom:1px solid #e7e1d5;text-align:right;font-family:monospace">${d.ddm_days} j</td></tr>`
    )
    .join("")
  const html = `
    <h2 style="font-family:Georgia,serif">DDM courte — ${flagged.length} produit${
      flagged.length > 1 ? "s" : ""
    }</h2>
    <p>Seuil : ${threshold} jours. Penser à les valoriser :</p>
    <table style="border-collapse:collapse;width:100%;font-family:Georgia,serif;font-size:14px">${rows}</table>
  `
  await sendEmail(container, {
    template: "ddm-short-alert",
    dedupe_key: `ddm-short:${new Date().toISOString().slice(0, 10)}`,
    to: recipient,
    subject: `[DDM] ${flagged.length} produit${
      flagged.length > 1 ? "s" : ""
    } à valoriser`,
    html,
    text: flagged
      .map((d) => `- ${d.product_title}: ${d.ddm_days} j`)
      .join("\n"),
  })
  logger.info(`[jobs/ddm-short-alert] alerted on ${flagged.length} products`)
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
  name: "ddm-short-alert",
  schedule: "30 7 * * *",
}
