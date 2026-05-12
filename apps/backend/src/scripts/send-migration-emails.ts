import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { parseArgs } from "../migration/source"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Sends the migration welcome email to every customer carrying
 * `metadata.migrated_from = "lehena-wp"`. Throttled to BATCH_SIZE per run
 * with a configurable delay between batches — Resend deliverability is
 * sensitive to bursts on a freshly-warmed domain.
 *
 * Usage:
 *   medusa exec ./src/scripts/send-migration-emails.ts [--commit] [--limit=N] [--batch-size=500] [--delay-ms=200]
 *
 * The script EMITS `customer.migrated` for each target — the subscriber
 * (`subscribers/customer-migrated.ts`) does the actual send. Idempotent
 * because that subscriber's dedupe_key is keyed on the customer id.
 */
export default async function sendMigrationEmails({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const customerService = container.resolve(Modules.CUSTOMER)
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const args = parseArgs(process.argv.slice(2))
  const dryRun = !("commit" in args)
  const limit = args.limit ? parseInt(args.limit, 10) : Number.POSITIVE_INFINITY
  const batchSize = args["batch-size"] ? parseInt(args["batch-size"], 10) : 500
  const delayMs = args["delay-ms"] ? parseInt(args["delay-ms"], 10) : 200

  let offset = 0
  let totalEmitted = 0

  // We page through customers so we don't hold tens of thousands of rows
  // in memory at once. Filter by metadata field at the DB level.
  while (totalEmitted < limit) {
    const page = await customerService.listCustomers(
      // The metadata jsonb operator is provider-specific; in V1 we filter
      // post-fetch to stay agnostic of the underlying store.
      {},
      { take: batchSize, skip: offset, order: { created_at: "ASC" } }
    )
    if (page.length === 0) break
    offset += page.length

    const migrated = page.filter(
      (c) =>
        ((c.metadata as Record<string, unknown> | null) ?? {}).migrated_from ===
        "lehena-wp"
    )
    if (migrated.length === 0) continue

    for (const c of migrated) {
      if (totalEmitted >= limit) break
      if (!c.email) continue
      if (dryRun) {
        logger.info(
          `[send-migration-emails] would emit customer.migrated for ${c.email} (${c.id})`
        )
      } else {
        await eventBus.emit({
          name: "customer.migrated",
          data: { id: c.id, email: c.email },
        })
      }
      totalEmitted++
    }
    if (!dryRun && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  logger.info(
    `[send-migration-emails] ${dryRun ? "dryRun" : "committed"} — emitted ${totalEmitted} customer.migrated events`
  )
}
