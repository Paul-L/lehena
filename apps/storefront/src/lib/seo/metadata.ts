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
  /** Override the `og:type`. Default `website`; use `article` for editorial pages. */
  ogType?: "website" | "article"
  /** Language code for og:locale (ISO 639-1, e.g. `fr_FR`). Default `fr_FR`. */
  ogLocale?: string
}

export const SITE_NAME = "Maison Lehena"
export const SITE_TAGLINE = "Maître artisan charcutier au Pays Basque"
export const DEFAULT_TITLE = `${SITE_NAME} · ${SITE_TAGLINE}`
export const DEFAULT_DESCRIPTION =
  "Maître Artisan Charcutier au Pays Basque depuis 1974. Jambons affinés 24 mois, salaisons sans nitrite, patxaran et épicerie fine du Sud-Ouest."
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
  const ogImage = input.ogImage ?? DEFAULT_OG_IMAGE
  const ogImageAbsolute = ogImage.startsWith("http")
    ? ogImage
    : `${baseUrl}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      type: input.ogType ?? "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: input.ogLocale ?? "fr_FR",
      images: [{ url: ogImageAbsolute, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageAbsolute],
    },
  }

  if (input.canonical) {
    metadata.alternates = { canonical: input.canonical }
  }

  if (input.noindex) {
    metadata.robots = { index: false, follow: true }
  }

  return metadata
}
