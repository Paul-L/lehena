import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

// V1: log-only newsletter stub. Brevo integration lands in Phase 7 (cf. ADR-001).
// No persistence in V1 — emails appear in the storefront server logs only.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

interface RateLimitBucket {
  count: number
  expiresAt: number
}

const RATE_WINDOW_MS = 60_000 // 1 minute
const RATE_MAX = 6 // max 6 submissions per minute per IP
const buckets = new Map<string, RateLimitBucket>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)
  if (!bucket || bucket.expiresAt < now) {
    buckets.set(ip, { count: 1, expiresAt: now + RATE_WINDOW_MS })
    return true
  }
  if (bucket.count >= RATE_MAX) return false
  bucket.count += 1
  return true
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req)
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).email !== "string"
  ) {
    return NextResponse.json(
      { ok: false, error: "Email requis." },
      { status: 400 }
    )
  }
  const email = (body as { email: string }).email.trim().toLowerCase()

  if (email.length > 320 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Format d'email invalide." },
      { status: 400 }
    )
  }

  const source =
    typeof (body as Record<string, unknown>).source === "string"
      ? (body as { source: string }).source.slice(0, 32)
      : "unknown"

  // V1 sink: log only. Phase 7 will dispatch to Brevo + persist in customer DB.

  console.info(
    `[newsletter] new subscriber email=${email} source=${source} ip=${ip}`
  )

  return NextResponse.json({ ok: true }, { status: 200 })
}
