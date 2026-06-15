import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

import { mapProduct } from "../mappers/product"
import { resolveReader } from "../source"
import {
  buildWorkflowProductInput,
  type WorkflowResolvedContext,
} from "../to-workflow-input"

import type { MedusaContainer } from "@medusajs/framework/types"
import type { MigrationReportEntry } from "../types"

export interface RunnerOptions {
  source: "api" | "fixtures"
  commit: boolean
  limit?: number
}

export interface RunnerResult {
  totals: {
    seen: number
    created: number
    updated: number
    skipped: number
    failed: number
  }
  entries: MigrationReportEntry[]
  source_name: string
}

/**
 * Headless products migration runner. Same logic as the CLI but
 * decoupled from process.argv and the JSON report file — callers manage
 * those at a higher level (CLI wrapper or workflow step).
 */
export async function runProductsMigration(
  container: MedusaContainer,
  opts: RunnerOptions
): Promise<RunnerResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productService = container.resolve(Modules.PRODUCT)

  const reader = await resolveReader(container, opts.source)
  if (!reader) {
    throw new Error(
      "[runProductsMigration] No source. Save WC credentials in the admin, set WC_API_URL+creds, or pass source=fixtures."
    )
  }

  let ctx: WorkflowResolvedContext | null = null
  if (opts.commit) {
    ctx = await resolveContext(container)
    if (!ctx) {
      throw new Error(
        "[runProductsMigration] Cannot commit: missing sales channel, shipping profiles, or categories. Run `npm run seed` first."
      )
    }
  }

  const limit = opts.limit ?? Number.POSITIVE_INFINITY
  const entries: MigrationReportEntry[] = []
  let seen = 0

  for await (const legacy of reader.listProducts()) {
    if (seen >= limit) break
    seen++
    const mapped = mapProduct(legacy)
    if (mapped.variants.length === 0) {
      entries.push({
        legacy_id: legacy.id,
        outcome: "skipped",
        notes: "no variants mapped",
      })
      continue
    }

    try {
      const existing = await productService.listProducts(
        { handle: mapped.handle },
        { take: 1 }
      )
      if (existing.length > 0) {
        entries.push({
          legacy_id: legacy.id,
          outcome: "skipped",
          medusa_id: existing[0].id,
          notes: "handle already exists",
        })
        continue
      }

      if (!opts.commit || !ctx) {
        entries.push({
          legacy_id: legacy.id,
          outcome: "created",
          notes: `would create handle=${mapped.handle} category=${mapped.category_handle} variants=${mapped.variants.length}`,
        })
        continue
      }

      const built = buildWorkflowProductInput(mapped, ctx)
      if (!built) {
        entries.push({
          legacy_id: legacy.id,
          outcome: "skipped",
          notes: `unresolved category=${mapped.category_handle} or no priced variants`,
        })
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [built.product],
          additional_data: built.additional_data,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      })
      const createdId = Array.isArray(result) ? result[0]?.id : undefined
      entries.push({
        legacy_id: legacy.id,
        outcome: "created",
        medusa_id: createdId,
        notes: `created handle=${mapped.handle} variants=${(built.product.variants as unknown[] | undefined)?.length ?? 0}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`[runProductsMigration] legacy=${legacy.id} ${message}`)
      entries.push({
        legacy_id: legacy.id,
        outcome: "failed",
        notes: message,
      })
    }
  }

  const totals = {
    seen,
    created: entries.filter((e) => e.outcome === "created").length,
    updated: entries.filter((e) => e.outcome === "updated").length,
    skipped: entries.filter((e) => e.outcome === "skipped").length,
    failed: entries.filter((e) => e.outcome === "failed").length,
  }

  return { totals, entries, source_name: reader.name }
}

async function resolveContext(
  container: MedusaContainer
): Promise<WorkflowResolvedContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "is_disabled"],
  })
  const defaultSalesChannel = (salesChannels ?? []).find(
    (c) => !c.is_disabled
  )
  if (!defaultSalesChannel?.id) {
    logger.error("[runProductsMigration] No enabled sales channel found.")
    return null
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })
  const fresh = profiles?.find((p) => p.name === "fresh_chronofresh")
  const ambient = profiles?.find((p) => p.name === "ambient_colissimo")
  if (!fresh?.id || !ambient?.id) {
    logger.error(
      "[runProductsMigration] Missing shipping profiles fresh_chronofresh / ambient_colissimo."
    )
    return null
  }

  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const categoryIdByHandle = new Map<string, string>(
    (cats ?? []).flatMap((c) =>
      c?.id && c?.handle ? ([[c.handle, c.id]] as [string, string][]) : []
    )
  )
  if (categoryIdByHandle.size === 0) {
    logger.error("[runProductsMigration] No product categories resolved.")
    return null
  }

  return {
    defaultSalesChannelId: defaultSalesChannel.id,
    shippingProfileIds: { fresh: fresh.id, ambient: ambient.id },
    categoryIdByHandle,
  }
}
