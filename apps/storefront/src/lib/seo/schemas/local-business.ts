/**
 * Schema.org LocalBusiness (FoodStore subtype) for the Lehena workshop +
 * boutique. Used by `/fr/atelier` and the footer organisation block.
 *
 * Lat/lng + opening hours are baked in here so the page can stay a Server
 * Component — the data is operator-controlled, not visitor-controlled.
 */

export interface OpeningHours {
  /** ISO day codes per schema.org: Mo, Tu, We, Th, Fr, Sa, Su. */
  days: string[]
  /** "09:00" — 24h format. */
  opens: string
  /** "18:00" — 24h format. */
  closes: string
}

export interface LocalBusinessSchemaInput {
  url: string
  name?: string
  description?: string | null
  image?: string | null
  telephone?: string | null
  email?: string | null
  /** Currency-agnostic price tier marker, schema.org convention. */
  price_range?: "€" | "€€" | "€€€" | "€€€€"
  address: {
    streetAddress: string
    addressLocality: string
    postalCode: string
    addressRegion?: string
    addressCountry: string
  }
  geo: {
    latitude: number
    longitude: number
  }
  opening_hours: OpeningHours[]
  /** Same-as URLs for the organisation's social presence. */
  same_as?: string[]
}

const DEFAULT_BUSINESS_NAME = "Maison Lehena"

export function localBusinessSchema(input: LocalBusinessSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "FoodStore"],
    "@id": `${input.url}#localbusiness`,
    name: input.name ?? DEFAULT_BUSINESS_NAME,
    url: input.url,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    telephone: input.telephone ?? undefined,
    email: input.email ?? undefined,
    priceRange: input.price_range ?? "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address.streetAddress,
      addressLocality: input.address.addressLocality,
      postalCode: input.address.postalCode,
      addressRegion: input.address.addressRegion,
      addressCountry: input.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.geo.latitude,
      longitude: input.geo.longitude,
    },
    openingHoursSpecification: input.opening_hours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days.map(dayCodeToFullName),
      opens: slot.opens,
      closes: slot.closes,
    })),
    sameAs:
      input.same_as && input.same_as.length > 0 ? input.same_as : undefined,
  }
}

/**
 * Schema.org expects full English day names in `dayOfWeek` (e.g. "Monday"),
 * but our config uses ISO short codes (Mo, Tu, …) because they're easier
 * to type and validate. Translate at serialisation time.
 */
function dayCodeToFullName(code: string): string {
  const map: Record<string, string> = {
    Mo: "Monday",
    Tu: "Tuesday",
    We: "Wednesday",
    Th: "Thursday",
    Fr: "Friday",
    Sa: "Saturday",
    Su: "Sunday",
  }
  return map[code] ?? code
}

/**
 * Default Lehena workshop configuration — used by `/fr/atelier`. Operator
 * edits here when the boutique hours change; no DB column.
 */
export const LEHENA_WORKSHOP: LocalBusinessSchemaInput = {
  url: "https://lehena.fr/fr/atelier",
  name: "Maison Lehena — Atelier & boutique",
  description:
    "Atelier d'affinage et boutique de la Maison Lehena, à Laguinge, en Soule (Pays Basque). Visites sur rendez-vous.",
  image: "https://lehena.fr/atelier-cover.jpg",
  email: "contact@lehena.fr",
  price_range: "€€€",
  address: {
    streetAddress: "Bourg",
    addressLocality: "Laguinge",
    postalCode: "64470",
    addressRegion: "Pyrénées-Atlantiques",
    addressCountry: "FR",
  },
  geo: {
    // Approximate centre of Laguinge — adjust to the precise atelier
    // coordinates before launch.
    latitude: 43.166,
    longitude: -0.984,
  },
  opening_hours: [
    {
      days: ["Sa"],
      opens: "09:00",
      closes: "13:00",
    },
  ],
  same_as: [
    "https://www.instagram.com/maison.lehena",
    "https://www.facebook.com/maison.lehena",
  ],
}
