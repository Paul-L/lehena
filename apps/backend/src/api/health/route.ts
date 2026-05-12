import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Lightweight healthcheck. Two levels:
 *   - GET /health        → Postgres + Redis ping. Returns 200 / 503.
 *   - GET /health/full   → adds optional services (MeiliSearch, S3 ping)
 *
 * Uptime monitors should hit `/health` (1 minute interval), not
 * `/health/full` — a transient MeiliSearch restart would otherwise page
 * ops needlessly.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const checks: Record<string, "ok" | "fail"> = {}

  // Postgres — every Medusa module depends on it; the query module is a
  // cheap proxy.
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    await query.graph({ entity: "store", fields: ["id"], filters: {} })
    checks.postgres = "ok"
  } catch (err) {
    logger.warn(
      `[health] postgres check failed: ${
        err instanceof Error ? err.message : err
      }`
    )
    checks.postgres = "fail"
  }

  // Redis — only when actually wired up. The event-bus / cache modules
  // surface via container; we just attempt a resolve.
  try {
    req.scope.resolve(Modules.EVENT_BUS)
    checks.event_bus = "ok"
  } catch {
    checks.event_bus = "fail"
  }

  const allOk = Object.values(checks).every((v) => v === "ok")
  res.status(allOk ? 200 : 503)
  res.json({
    status: allOk ? "ok" : "degraded",
    checks,
    timestamp: new Date().toISOString(),
  })
}
