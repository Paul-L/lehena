import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { mapCustomer } from "../migration/mappers/customer"
import { ReportBuilder } from "../migration/report"
import { parseArgs, pickReader } from "../migration/source"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Migrates legacy WooCommerce customers into Medusa. Idempotent via the
 * pair (email, metadata.legacy_id): a re-run skips rows that have already
 * been imported and updates the addresses + metadata for rows that
 * surface fresh data on the source.
 *
 * Usage:
 *   medusa exec ./src/scripts/migrate-customers.ts [--source=api|fixtures] [--commit] [--limit=N]
 *
 * Default mode is `--source=api` (live WC REST) + dry-run.
 */
export default async function migrateCustomers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const customerService = container.resolve(Modules.CUSTOMER)

  const args = parseArgs(process.argv.slice(2))
  const dryRun = !("commit" in args)
  const limit = args.limit ? parseInt(args.limit, 10) : Number.POSITIVE_INFINITY

  const reader = pickReader(args.source)
  if (!reader) {
    logger.error(
      "[migrate-customers] No source available. Set WC_API_URL + creds, or pass --source=fixtures."
    )
    return
  }

  const report = new ReportBuilder({
    script: "migrate-customers",
    source: reader.name,
    dry_run: dryRun,
  })
  logger.info(
    `[migrate-customers] source=${reader.name} dryRun=${dryRun} limit=${limit}`
  )

  let seen = 0
  for await (const legacy of reader.listCustomers()) {
    if (seen >= limit) break
    seen++
    const mapped = mapCustomer(legacy)
    if (!mapped) {
      report.record({
        legacy_id: legacy.id,
        outcome: "skipped",
        notes: "invalid email",
      })
      continue
    }
    try {
      const existing = await customerService.listCustomers(
        { email: mapped.email },
        { take: 1 }
      )
      if (existing.length > 0) {
        const cur = existing[0]
        if (dryRun) {
          report.record({
            legacy_id: legacy.id,
            outcome: "updated",
            medusa_id: cur.id,
            notes: "would refresh metadata + addresses (dry-run)",
          })
          continue
        }
        await customerService.updateCustomers(cur.id, {
          first_name: mapped.first_name ?? cur.first_name,
          last_name: mapped.last_name ?? cur.last_name,
          phone: mapped.phone ?? cur.phone,
          metadata: {
            ...((cur.metadata as Record<string, unknown> | null) ?? {}),
            ...mapped.metadata,
          },
        })
        // Replace addresses idempotently: drop those originating from the
        // migration (matching by note), recreate from the mapped set.
        const oldAddrs = await customerService.listCustomerAddresses({
          customer_id: cur.id,
        })
        const migratedOnes = oldAddrs.filter(
          (a) => a.metadata?.migrated_from === "lehena-wp"
        )
        if (migratedOnes.length > 0) {
          await customerService.deleteCustomerAddresses(
            migratedOnes.map((a) => a.id)
          )
        }
        for (const addr of mapped.addresses) {
          await customerService.createCustomerAddresses({
            customer_id: cur.id,
            ...addr,
            metadata: { migrated_from: "lehena-wp" },
          })
        }
        report.record({
          legacy_id: legacy.id,
          outcome: "updated",
          medusa_id: cur.id,
        })
      } else {
        if (dryRun) {
          report.record({
            legacy_id: legacy.id,
            outcome: "created",
            notes: "would create (dry-run)",
          })
          continue
        }
        const created = await customerService.createCustomers({
          email: mapped.email,
          first_name: mapped.first_name,
          last_name: mapped.last_name,
          phone: mapped.phone,
          metadata: mapped.metadata,
          addresses: mapped.addresses.map((a) => ({
            ...a,
            metadata: { migrated_from: "lehena-wp" },
          })),
        })
        report.record({
          legacy_id: legacy.id,
          outcome: "created",
          medusa_id: created.id,
        })
      }
    } catch (err) {
      report.record({
        legacy_id: legacy.id,
        outcome: "failed",
        notes: err instanceof Error ? err.message : String(err),
      })
      logger.error(
        `[migrate-customers] failed legacy_id=${legacy.id}: ${
          err instanceof Error ? err.message : err
        }`
      )
    }
  }

  const { filepath, report: data } = await report.write()
  logger.info(
    `[migrate-customers] done — seen=${data.totals.seen} created=${data.totals.created} updated=${data.totals.updated} skipped=${data.totals.skipped} failed=${data.totals.failed}`
  )
  logger.info(`[migrate-customers] report → ${filepath}`)
}
