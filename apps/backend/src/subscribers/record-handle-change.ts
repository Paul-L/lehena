import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { ensureRedirectOnHandleChangeWorkflow } from "../workflows/redirects/ensure-redirect-on-handle-change"

// Watches product + category lifecycle events and lets the redirects module
// know about the current handle. The workflow itself decides whether to
// initialise a snapshot, do nothing, or open a 301.

export default async function recordHandleChange({
  event: { name: eventName, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const entityAndPath = (() => {
    if (eventName.startsWith("product.")) {
      return { entity: "product" as const, resource_type: "product" as const }
    }
    if (eventName.startsWith("product_category.")) {
      return {
        entity: "product_category" as const,
        resource_type: "category" as const,
      }
    }
    return null
  })()

  if (!entityAndPath) {
    return
  }

  try {
    const result = await query.graph({
      entity: entityAndPath.entity,
      fields: ["id", "handle"],
      filters: { id: data.id },
    })
    const row = result.data[0] as
      | { id: string; handle?: string | null }
      | undefined
    if (!row || !row.handle) {
      return
    }

    await ensureRedirectOnHandleChangeWorkflow(container).run({
      input: {
        resource_type: entityAndPath.resource_type,
        resource_id: row.id,
        current_handle: row.handle,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error(
      `[redirects subscriber] failed to handle ${eventName} for ${data.id}: ${msg}`
    )
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product_category.created",
    "product_category.updated",
  ],
}
