import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { generateInvoiceWorkflow } from "../workflows/invoice"

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Generates the PDF invoice as soon as an order is placed. Idempotent — the
 * workflow's generate step short-circuits if an invoice already exists for
 * the order, so retries from a redelivered event don't double-issue.
 */
export default async function orderPlacedInvoiceHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { id } = event.data
  try {
    await generateInvoiceWorkflow(container).run({
      input: { order_id: id },
    })
    logger.info(`[invoice] generated for order ${id}`)
  } catch (err) {
    logger.error(
      `[invoice] generation failed for order ${id}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
