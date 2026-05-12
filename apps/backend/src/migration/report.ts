import fs from "node:fs/promises"
import path from "node:path"

import type { MigrationReport, MigrationReportEntry } from "./types"

/**
 * Accumulator for migration script outcomes. Emit a JSON file at the end
 * so QA can grep for failures and re-run targeted scripts.
 */
export class ReportBuilder {
  private readonly script: string
  private readonly source: string
  private readonly dry_run: boolean
  private readonly started_at: string
  private readonly entries: MigrationReportEntry[] = []

  constructor(opts: { script: string; source: string; dry_run: boolean }) {
    this.script = opts.script
    this.source = opts.source
    this.dry_run = opts.dry_run
    this.started_at = new Date().toISOString()
  }

  record(entry: MigrationReportEntry) {
    this.entries.push(entry)
  }

  async write(): Promise<{ filepath: string; report: MigrationReport }> {
    const totals = {
      seen: this.entries.length,
      created: this.entries.filter((e) => e.outcome === "created").length,
      updated: this.entries.filter((e) => e.outcome === "updated").length,
      skipped: this.entries.filter((e) => e.outcome === "skipped").length,
      failed: this.entries.filter((e) => e.outcome === "failed").length,
    }
    const report: MigrationReport = {
      script: this.script,
      source: this.source,
      started_at: this.started_at,
      finished_at: new Date().toISOString(),
      dry_run: this.dry_run,
      totals,
      entries: this.entries,
    }
    const dir = path.resolve(process.cwd(), "migration-reports")
    await fs.mkdir(dir, { recursive: true })
    const filename = `migration-report-${this.script}-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}${this.dry_run ? "-dryrun" : ""}.json`
    const filepath = path.join(dir, filename)
    await fs.writeFile(filepath, JSON.stringify(report, null, 2))
    return { filepath, report }
  }
}
