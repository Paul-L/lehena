import { NextResponse } from "next/server"

/**
 * Storefront liveness check. Pings the backend `/health` route (when
 * configured) and reports back with an aggregated status. Uptime monitors
 * should hit this — not the backend directly — so a degraded backend is
 * visible from the customer's perspective.
 */
export async function GET() {
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  const checks: Record<string, "ok" | "fail" | "skipped"> = {
    storefront: "ok",
  }

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, "")}/health`, {
        signal: AbortSignal.timeout(3000),
      })
      checks.backend = res.ok ? "ok" : "fail"
    } catch {
      checks.backend = "fail"
    }
  } else {
    checks.backend = "skipped"
  }

  const allOk = Object.values(checks).every(
    (v) => v === "ok" || v === "skipped"
  )
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
