import path from "node:path"

import { MIGRATION_MODULE } from "../modules/migration"

import { CsvFixtureReader } from "./readers/csv-fixture"
import { WooCommerceApiReader } from "./readers/woocommerce-api"

import type { MedusaContainer } from "@medusajs/framework/types"

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
 * Async resolver used by the workflow runners. Prefers credentials saved
 * in the `migration` module (admin UI) over env vars — falls back to env
 * if the module returns nothing. Fixtures sources are loaded sync just
 * like `pickReader`.
 *
 * Use this from anywhere that has a container; `pickReader` stays for
 * pure env-driven contexts (CLI/local dev without the admin UI).
 */
export async function resolveReader(
  container: MedusaContainer,
  rawSource: string | undefined
): Promise<MigrationReader | null> {
  const source = rawSource ?? "api"
  if (source.startsWith("fixtures")) return pickReader(source)
  if (source !== "api") return null

  try {
    const service = container.resolve(MIGRATION_MODULE)
    const saved = await service.resolveWcCredentials()
    if (saved) {
      return new WooCommerceApiReader({
        baseUrl: saved.url,
        consumerKey: saved.consumerKey,
        consumerSecret: saved.consumerSecret,
      })
    }
  } catch {
    // Module unavailable — fall through to env.
  }
  return WooCommerceApiReader.fromEnv()
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
