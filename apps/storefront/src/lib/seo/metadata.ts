import { getBaseURL } from "@lib/util/env"

import type { Metadata } from "next"

interface BuildMetadataInput {
  /** Page-specific title. Will be composed with the brand suffix. */
  title?: string
  /** Page-specific meta description. */
  description?: string
  /** Absolute or root-relative URL of the OG image. Falls back to default. */
  ogImage?: string
  /** Override the canonical URL (must be absolute). */
  canonical?: string
  /** Block search engines from indexing this page. */
  noindex?: boolean
  /** Override the `og:type`. Default `website`; use `article` for editorial pages, `product` for PDPs. */
  ogType?: "website" | "article" | "product"
  /** Language code for og:locale (ISO 639-1, e.g. `fr_FR`). Default `fr_FR`. */
  ogLocale?: string
}

export const SITE_NAME = "Maison Lehena"
/** Twitter/X handle used for both `twitter:site` and `twitter:creator`. */
export const SITE_TWITTER = "@maisonlehena"
/** Brand red — surfaced as the `theme-color` meta tag. */
export const BRAND_COLOR = "#a83925"
export const SITE_TAGLINE = "Maître artisan charcutier au Pays Basque"
export const DEFAULT_TITLE = `${SITE_NAME} · ${SITE_TAGLINE}`
export const DEFAULT_DESCRIPTION =
  "Maître Artisan Charcutier au Pays Basque. Jambons affinés 15 mois minimum, salaisons sans nitrite, patxaran et épicerie fine du Sud-Ouest."
export const DEFAULT_OG_IMAGE = "/og/lehena-default.jpg"

/**
 * Build a Next.js Metadata object with Lehena defaults applied.
 *
 * - Adds the brand suffix to the title (unless the page title already ends with "Lehena").
 * - Falls back to the default OG image when none is provided.
 * - Sets canonical from `metadataBase` + `canonical` (or the current path passed via metadataBase).
 * - Honors `noindex` by emitting `robots: { index: false, follow: true }`.
 */
export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  const rawTitle = input.title?.trim()
  const title = rawTitle
    ? rawTitle.toLowerCase().includes("lehena")
      ? rawTitle
      : `${rawTitle} · ${SITE_NAME}`
    : DEFAULT_TITLE
  const description = input.description ?? DEFAULT_DESCRIPTION
  // When no OG image is passed, omit `images` so Next's file-based
  // `opengraph-image.jpg` / `twitter-image.jpg` conventions supply the default.
  // (DEFAULT_OG_IMAGE pointed at /og/lehena-default.jpg, which 404s and
  // overrode the working convention on every page.)
  const ogImage = input.ogImage
  const ogImageAbsolute = ogImage
    ? ogImage.startsWith("http")
      ? ogImage
      : `${baseUrl}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : undefined

  // Default indexing directives. `noindex` overrides `index`/`follow` while
  // keeping the rich-preview hints so Google still renders large snippets.
  const robots: Metadata["robots"] = {
    index: !input.noindex,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  }

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      // Next types `og:type` as a discriminated union that doesn't include
      // "product" and rejects a union-typed discriminant. Pin the compile-time
      // type to a single literal; the real value (incl. "product") is emitted.
      type: (input.ogType ?? "website") as "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: input.ogLocale ?? "fr_FR",
      ...(input.canonical ? { url: input.canonical } : {}),
      ...(ogImageAbsolute
        ? { images: [{ url: ogImageAbsolute, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_TWITTER,
      creator: SITE_TWITTER,
      title,
      description,
      ...(ogImageAbsolute ? { images: [ogImageAbsolute] } : {}),
    },
    robots,
    other: {
      "theme-color": BRAND_COLOR,
    },
  }

  if (input.canonical) {
    metadata.alternates = { canonical: input.canonical }
  }

  return metadata
}
