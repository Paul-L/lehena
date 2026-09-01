import { getBaseURL } from "@lib/util/env"

import { BRAND_COLOR, SITE_NAME, SITE_TAGLINE } from "./metadata"

/**
 * Shared building blocks for the dynamic Open Graph images generated with
 * `next/og` (`ImageResponse`). Kept framework-agnostic (no JSX) so it can be
 * imported from every `opengraph-image.tsx` route without pulling React types
 * into a plain module.
 *
 * Fonts: `ImageResponse` ships with a bundled default font (Noto Sans), so we
 * deliberately embed no custom WOFF/TTF here — none exist in the repo and the
 * brief accepts the Satori default. Text therefore always renders.
 */

/** Canonical OG canvas — 1.91:1, the ratio Facebook/LinkedIn/WhatsApp expect. */
export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = "image/png"

/** Lehena palette pulled from the design system. */
export const OG_COLORS = {
  rouge: BRAND_COLOR,
  cream: "#f5efe3",
  ink: "#2b2019",
  muted: "#6f6155",
} as const

export const OG_SITE_NAME = SITE_NAME
export const OG_SITE_TAGLINE = SITE_TAGLINE

/**
 * Fetch a remote image and return it as a base64 `data:` URL that Satori can
 * embed directly. Returns `null` on any failure (non-2xx, network error, empty
 * body, missing/unknown content type) so callers can fall back to a text-only
 * layout instead of throwing — an OG route must never 500, or social scrapers
 * cache the broken result for up to 24h.
 */
export async function fetchImageAsDataURL(
  rawUrl: string | null | undefined
): Promise<string | null> {
  if (!rawUrl) return null

  // Resolve root-relative paths (e.g. "/og/x.jpg") against the site base URL;
  // leave absolute http(s) URLs untouched.
  const url = rawUrl.startsWith("http")
    ? rawUrl
    : `${getBaseURL().replace(/\/$/, "")}${
        rawUrl.startsWith("/") ? "" : "/"
      }${rawUrl}`

  try {
    const res = await fetch(url, {
      // OG images change rarely; let the platform cache the upstream asset.
      next: { revalidate: 604800 },
    })
    if (!res.ok) return null

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.byteLength === 0) return null

    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}
