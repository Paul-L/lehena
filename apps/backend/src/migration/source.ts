import path from "node:path"

import { CsvFixtureReader } from "./readers/csv-fixture"
import { WooCommerceApiReader } from "./readers/woocommerce-api"

import type { MigrationReader } from "./types"

/**
 * Picks the right reader based on the script's CLI flags.
 *
 *   --source=fixtures           → CsvFixtureReader rooted at
 *                                 backend/fixtures/migration/
 *   --source=fixtures:<dir>     → CsvFixtureReader rooted at <dir>
 *   --source=api (default)      → WooCommerceApiReader from env
 *
 * Returns null when `api` is requested but the env vars aren't set —
 * callers should treat that as a hard error.
 */
export function pickReader(
  rawSource: string | undefined
): MigrationReader | null {
  const source = rawSource ?? "api"
  if (source.startsWith("fixtures")) {
    const colon = source.indexOf(":")
    const dir =
      colon === -1
        ? path.resolve(process.cwd(), "fixtures/migration")
        : path.resolve(process.cwd(), source.slice(colon + 1))
    return new CsvFixtureReader(dir)
  }
  if (source === "api") {
    return WooCommerceApiReader.fromEnv()
  }
  return null
}

/**
 * Parses common --flag=value style args. Returns a map of flag name → value.
 * Boolean flags appear as empty string ("").
 */
export function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of argv) {
    if (!a.startsWith("--")) continue
    const body = a.slice(2)
    const eq = body.indexOf("=")
    if (eq === -1) out[body] = ""
    else out[body.slice(0, eq)] = body.slice(eq + 1)
  }
  return out
}
