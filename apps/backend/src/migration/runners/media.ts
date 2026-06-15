import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { resolveReader } from "../source"

import type { MedusaContainer } from "@medusajs/framework/types"
import type { MigrationReportEntry } from "../types"
import type { RunnerOptions, RunnerResult } from "./products"

/**
 * Headless media migration runner. Iterates the legacy catalog, downloads
 * every image URL once (deduped by src), and re-uploads it through the
 * Medusa File Module. Each report entry carries `legacy_url → medusa_url`
 * in `notes` so the products runner / consumers can resolve URLs from the
 * persisted run.
 *
 * `limit` here caps the number of *uploads* (not products seen), matching
 * the CLI semantics. Dry-run records a "would download+upload" entry per
 * unique URL without hitting the network.
 */
export async function runMediaMigration(
  container: MedusaContainer,
  opts: RunnerOptions
): Promise<RunnerResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fileService = container.resolve(Modules.FILE)

  const reader = await resolveReader(container, opts.source)
  if (!reader) {
    throw new Error(
      "[runMediaMigration] No source. Save WC credentials in the admin, set WC_API_URL+creds, or pass source=fixtures."
    )
  }

  const limit = opts.limit ?? Number.POSITIVE_INFINITY
  const entries: MigrationReportEntry[] = []
  const seenSources = new Set<string>()
  let processed = 0

  outer: for await (const p of reader.listProducts()) {
    for (const img of p.images) {
      if (processed >= limit) break outer
      if (seenSources.has(img.src)) continue
      seenSources.add(img.src)
      processed++

      try {
        if (!opts.commit) {
          entries.push({
            legacy_id: p.id,
            outcome: "created",
            notes: `would download+upload ${img.src}`,
          })
          continue
        }
        const res = await fetch(img.src)
        if (!res.ok) {
          entries.push({
            legacy_id: p.id,
            outcome: "failed",
            notes: `${res.status} on ${img.src}`,
          })
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        const mimeType =
          res.headers.get("content-type") ?? "application/octet-stream"
        const filename = img.src.split("/").pop() ?? `media-${p.id}.bin`
        const [uploaded] = await fileService.createFiles([
          { filename, mimeType, content: buf.toString("binary") },
        ])
        entries.push({
          legacy_id: p.id,
          outcome: "created",
          notes: `${img.src} → ${uploaded.url}`,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error(`[runMediaMigration] legacy=${p.id} ${message}`)
        entries.push({
          legacy_id: p.id,
          outcome: "failed",
          notes: message,
        })
      }
    }
  }

  const totals = {
    seen: processed,
    created: entries.filter((e) => e.outcome === "created").length,
    updated: entries.filter((e) => e.outcome === "updated").length,
    skipped: entries.filter((e) => e.outcome === "skipped").length,
    failed: entries.filter((e) => e.outcome === "failed").length,
  }

  return { totals, entries, source_name: reader.name }
}
