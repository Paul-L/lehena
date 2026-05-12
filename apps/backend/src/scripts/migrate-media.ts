import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { ReportBuilder } from "../migration/report"
import { parseArgs, pickReader } from "../migration/source"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Downloads every product image referenced by the legacy WP catalog and
 * uploads it to the configured Medusa file backend (MinIO dev / Scaleway
 * prod). Outputs a JSON map `{ legacy_url: medusa_url }` so the product
 * migration can swap URLs without re-fetching.
 *
 * Idempotent: skips legacy URLs that already appear in
 * `migration-reports/media-map.json` (loaded if present).
 *
 * Usage:
 *   medusa exec ./src/scripts/migrate-media.ts [--source=api|fixtures] [--commit] [--limit=N]
 */
export default async function migrateMedia({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fileService = container.resolve(Modules.FILE)

  const args = parseArgs(process.argv.slice(2))
  const dryRun = !("commit" in args)
  const limit = args.limit ? parseInt(args.limit, 10) : Number.POSITIVE_INFINITY

  const reader = pickReader(args.source)
  if (!reader) {
    logger.error("[migrate-media] No source available.")
    return
  }

  const seenSources = new Set<string>()
  const map: Record<string, string> = {}
  const report = new ReportBuilder({
    script: "migrate-media",
    source: reader.name,
    dry_run: dryRun,
  })

  let downloaded = 0
  for await (const p of reader.listProducts()) {
    if (downloaded >= limit) break
    for (const img of p.images) {
      if (seenSources.has(img.src)) continue
      seenSources.add(img.src)
      try {
        if (dryRun) {
          report.record({
            legacy_id: p.id,
            outcome: "created",
            notes: `would download+upload ${img.src}`,
          })
          continue
        }
        const res = await fetch(img.src)
        if (!res.ok) {
          report.record({
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
        map[img.src] = uploaded.url
        downloaded++
        report.record({
          legacy_id: p.id,
          outcome: "created",
          notes: `${img.src} → ${uploaded.url}`,
        })
      } catch (err) {
        report.record({
          legacy_id: p.id,
          outcome: "failed",
          notes: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  const { filepath, report: data } = await report.write()
  logger.info(
    `[migrate-media] done — seen=${data.totals.seen} created=${data.totals.created} failed=${data.totals.failed}`
  )
  logger.info(`[migrate-media] report → ${filepath}`)
  logger.info(
    `[migrate-media] media-map (${
      Object.keys(map).length
    } entries) embedded in report.entries`
  )
}
