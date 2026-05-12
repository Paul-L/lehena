import fs from "node:fs/promises"
import path from "node:path"

import type {
  LegacyCustomer,
  LegacyProduct,
  LegacyVariation,
  MigrationReader,
} from "../types"

/**
 * Deterministic reader fed from CSV fixtures shipped in the repo. Used by
 * unit tests and `--source=fixtures` dry-run smoke tests. Production
 * migration uses `WooCommerceApiReader` instead.
 *
 * CSV format is deliberately narrow — one row per product (variations are
 * encoded as JSON in a single column to keep the fixture files compact and
 * git-readable).
 */
export class CsvFixtureReader implements MigrationReader {
  readonly name: string

  constructor(private readonly dir: string) {
    this.name = `csv-fixture:${path.basename(dir)}`
  }

  async *listProducts(): AsyncIterable<LegacyProduct> {
    const rows = await readCsv(path.join(this.dir, "products.csv"))
    for (const row of rows) {
      const variations: LegacyVariation[] = row.variations_json
        ? safeJsonParse<LegacyVariation[]>(row.variations_json, [])
        : []
      const images = row.image_urls
        ? row.image_urls
            .split("|")
            .map((src) => ({ src: src.trim(), alt: null }))
        : []
      yield {
        id: Number(row.id),
        slug: row.slug,
        name: row.name,
        type: (row.type as LegacyProduct["type"]) ?? "simple",
        status: (row.status as LegacyProduct["status"]) ?? "publish",
        description: row.description || null,
        short_description: row.short_description || null,
        price: row.price || null,
        sku: row.sku || null,
        weight_grams: row.weight_grams ? Number(row.weight_grams) : null,
        categories: row.category_slugs
          ? row.category_slugs.split("|").map((slug, i) => ({
              id: i,
              slug: slug.trim(),
              name: slug.trim(),
            }))
          : [],
        tags: row.tags ? row.tags.split("|").map((s) => s.trim()) : [],
        images,
        variations,
        meta: row.meta_json ? safeJsonParse(row.meta_json, {}) : {},
      }
    }
  }

  async *listCustomers(): AsyncIterable<LegacyCustomer> {
    const rows = await readCsv(path.join(this.dir, "customers.csv"))
    for (const row of rows) {
      yield {
        id: Number(row.id),
        email: row.email,
        first_name: row.first_name || null,
        last_name: row.last_name || null,
        phone: row.phone || null,
        date_created: row.date_created || new Date().toISOString(),
        billing: row.billing_address_1
          ? {
              first_name: row.first_name || null,
              last_name: row.last_name || null,
              company: row.billing_company || null,
              address_1: row.billing_address_1,
              address_2: row.billing_address_2 || null,
              city: row.billing_city || null,
              state: row.billing_state || null,
              postcode: row.billing_postcode || null,
              country: row.billing_country || null,
              phone: row.phone || null,
            }
          : null,
        shipping: null,
        marketing_opt_in: row.marketing_opt_in === "true",
      }
    }
  }
}

/**
 * Minimal CSV parser — supports double-quoted fields with embedded commas
 * and `""` escapes, and a single header row. We avoid pulling in a heavy
 * library because the fixtures are checked-in and known to be tame.
 */
async function readCsv(file: string): Promise<Record<string, string>[]> {
  const content = await fs.readFile(file, "utf8")
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const header = parseCsvLine(lines[0])
  const out: Record<string, string>[] = []
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const obj: Record<string, string> = {}
    for (let i = 0; i < header.length; i++) {
      obj[header[i]] = cells[i] ?? ""
    }
    out.push(obj)
  }
  return out
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let buf = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        buf += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        buf += ch
      }
    } else {
      if (ch === ",") {
        out.push(buf)
        buf = ""
      } else if (ch === '"' && buf.length === 0) {
        inQuotes = true
      } else {
        buf += ch
      }
    }
  }
  out.push(buf)
  return out
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
