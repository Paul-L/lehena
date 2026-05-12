import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  mapCategoryRedirect,
  mapProductRedirect,
  STATIC_PAGE_REDIRECTS,
  type MappedRedirect,
} from "../migration/mappers/redirect"
import { ReportBuilder } from "../migration/report"
import { parseArgs, pickReader } from "../migration/source"
import { REDIRECTS_MODULE } from "../modules/redirects"

import type { ExecArgs } from "@medusajs/framework/types"

/**
 * Generates the 301 redirects map from legacy WP URLs to the new site.
 * Sources :
 *   - Static page mapping (Notre histoire, CGV, Contact, etc.)
 *   - Per-product : `/produit/<slug>/` → `/fr/products/<slug>`
 *   - Per-category : `/categorie-produit/<slug>/` → mapped Lehena category
 *
 * Idempotent: collisions on `from_path` skip the existing row.
 *
 * Usage:
 *   medusa exec ./src/scripts/build-redirects.ts [--source=api|fixtures] [--commit]
 */
export default async function buildRedirects({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const redirectService = container.resolve(REDIRECTS_MODULE) as {
    listRedirects: (
      f: Record<string, unknown>,
      o?: Record<string, unknown>
    ) => Promise<{ id: string; from_path: string }[]>
    createRedirects: (input: Record<string, unknown>) => Promise<{ id: string }>
  }

  const args = parseArgs(process.argv.slice(2))
  const dryRun = !("commit" in args)
  const reader = pickReader(args.source)
  if (!reader) {
    logger.error(
      "[build-redirects] No source available — pass --source=fixtures or set WC API env."
    )
    return
  }

  const collected: MappedRedirect[] = [...STATIC_PAGE_REDIRECTS]
  const seenCategorySlugs = new Set<string>()
  for await (const p of reader.listProducts()) {
    collected.push(mapProductRedirect(p))
    for (const cat of p.categories) {
      if (seenCategorySlugs.has(cat.slug)) continue
      seenCategorySlugs.add(cat.slug)
      collected.push(mapCategoryRedirect({ legacy_slug: cat.slug }))
    }
  }

  const report = new ReportBuilder({
    script: "build-redirects",
    source: reader.name,
    dry_run: dryRun,
  })

  for (const r of collected) {
    try {
      const dupes = await redirectService.listRedirects(
        { from_path: r.from_path },
        { take: 1 }
      )
      if (dupes.length > 0) {
        report.record({
          legacy_id: 0,
          outcome: "skipped",
          notes: `duplicate from_path ${r.from_path}`,
        })
        continue
      }
      if (dryRun) {
        report.record({
          legacy_id: 0,
          outcome: "created",
          notes: `would create ${r.from_path} → ${r.to_path}`,
        })
        continue
      }
      const created = await redirectService.createRedirects({
        from_path: r.from_path,
        to_path: r.to_path,
        status: r.status,
        source: r.source,
        note: r.note ?? null,
      })
      report.record({
        legacy_id: 0,
        outcome: "created",
        medusa_id: created.id,
        notes: `${r.from_path} → ${r.to_path}`,
      })
    } catch (err) {
      report.record({
        legacy_id: 0,
        outcome: "failed",
        notes: `${r.from_path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      })
    }
  }

  const { filepath, report: data } = await report.write()
  logger.info(
    `[build-redirects] done — seen=${data.totals.seen} created=${data.totals.created} skipped=${data.totals.skipped} failed=${data.totals.failed}`
  )
  logger.info(`[build-redirects] report → ${filepath}`)
}
