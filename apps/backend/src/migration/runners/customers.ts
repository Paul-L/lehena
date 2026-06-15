import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { mapCustomer } from "../mappers/customer"
import { resolveReader } from "../source"

import type { MedusaContainer } from "@medusajs/framework/types"
import type { MigrationReportEntry } from "../types"
import type { RunnerOptions, RunnerResult } from "./products"

/**
 * Headless customers migration runner. Mirrors the CLI logic but
 * decoupled from process.argv and the JSON report file — callers manage
 * those (CLI wrapper or workflow step).
 *
 * Idempotent via email: re-runs refresh metadata + addresses for known
 * rows. Addresses created by a previous migration run (matched by
 * `metadata.migrated_from === "lehena-wp"`) are dropped and recreated so
 * the source remains the source of truth.
 */
export async function runCustomersMigration(
  container: MedusaContainer,
  opts: RunnerOptions
): Promise<RunnerResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const customerService = container.resolve(Modules.CUSTOMER)

  const reader = await resolveReader(container, opts.source)
  if (!reader) {
    throw new Error(
      "[runCustomersMigration] No source. Save WC credentials in the admin, set WC_API_URL+creds, or pass source=fixtures."
    )
  }

  const limit = opts.limit ?? Number.POSITIVE_INFINITY
  const entries: MigrationReportEntry[] = []
  let seen = 0

  for await (const legacy of reader.listCustomers()) {
    if (seen >= limit) break
    seen++
    const mapped = mapCustomer(legacy)
    if (!mapped) {
      entries.push({
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
        if (!opts.commit) {
          entries.push({
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
        entries.push({
          legacy_id: legacy.id,
          outcome: "updated",
          medusa_id: cur.id,
        })
        continue
      }

      if (!opts.commit) {
        entries.push({
          legacy_id: legacy.id,
          outcome: "created",
          notes: `would create email=${mapped.email}`,
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
      entries.push({
        legacy_id: legacy.id,
        outcome: "created",
        medusa_id: created.id,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`[runCustomersMigration] legacy=${legacy.id} ${message}`)
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
