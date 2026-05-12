import {
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"

import { REDIRECTS_MODULE } from "../../../../modules/redirects"

/**
 * Looks up a single redirect by exact `from_path`. The Next.js middleware
 * hits this on every incoming request that hasn't matched a static route,
 * so we keep it tiny and cache-friendly.
 *
 * Returns 404 when no redirect matches — the middleware treats that as a
 * pass-through and lets Next.js render the page normally.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fromPath =
    typeof req.query.from_path === "string" ? req.query.from_path : ""
  if (!fromPath) {
    return res.status(400).json({ message: "from_path required" })
  }

  const redirectService = req.scope.resolve(REDIRECTS_MODULE) as {
    listRedirects: (
      f: Record<string, unknown>,
      o?: Record<string, unknown>
    ) => Promise<
      {
        from_path: string
        to_path: string
        status: number
      }[]
    >
  }
  const matches = await redirectService.listRedirects(
    { from_path: fromPath },
    { take: 1 }
  )
  if (matches.length === 0) {
    return res.status(404).json({ found: false })
  }
  const m = matches[0]
  // Short cache so the middleware doesn't slam us. 5 minutes mirrors the
  // Phase 8 spec; the table is small enough that stale-while-revalidate
  // is acceptable.
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300")
  return res.json({
    found: true,
    from_path: m.from_path,
    to_path: m.to_path,
    status: m.status,
  })
}
