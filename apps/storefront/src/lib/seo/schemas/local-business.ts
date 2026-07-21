/**
 * Schema.org LocalBusiness (FoodStore subtype) for the Lehena workshop +
 * boutique. Injected ONCE, on `/fr/atelier` only — never on the home page or
 * other slugs (multiple LocalBusiness nodes confuse Google's local graph).
 *
 * Lat/lng + opening hours are baked in here so the page can stay a Server
 * Component — the data is operator-controlled, not visitor-controlled.
 */

import { getBaseURL } from "@lib/util/env"

export interface OpeningHours {
  /** ISO day codes per schema.org: Mo, Tu, We, Th, Fr, Sa, Su. */
  days: string[]
  /** "09:00" — 24h format. */
  opens: string
  /** "18:00" — 24h format. */
  closes: string
}

/** schema.org area served — either an AdministrativeArea or a Country. */
export interface AreaServed {
  type: "AdministrativeArea" | "Country"
  name: string
}

export interface LocalBusinessSchemaInput {
  url: string
  name?: string
  description?: string | null
  /** One or more absolute photo URLs (Google prefers ≥3, multiple ratios). */
  image?: string | string[] | null
  /** Must be E.164 (e.g. "+33559XXXXXX") — omit entirely if unknown. */
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
  /** Google Maps / Google Business Profile URL (`?cid=…`). */
  has_map?: string | null
  area_served?: AreaServed[]
  serves_cuisine?: string[]
  accepts_reservations?: boolean
  /** Free-text list, e.g. "Cash, Credit Card, Contactless". */
  payment_accepted?: string
  /** ISO 4217, e.g. "EUR". */
  currencies_accepted?: string
}

const DEFAULT_BUSINESS_NAME = "Maison Lehena"

export function localBusinessSchema(input: LocalBusinessSchemaInput) {
  // The parent Organization node lives at the site root (see organization.ts):
  // reuse its @id so Google links the shop to the legal entity.
  const baseUrl = getBaseURL().replace(/\/$/, "")

  const areaServed =
    input.area_served && input.area_served.length > 0
      ? input.area_served.map((area) => ({
          "@type": area.type,
          name: area.name,
        }))
      : undefined

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
    parentOrganization: { "@id": `${baseUrl}/#organization` },
    areaServed,
    servesCuisine:
      input.serves_cuisine && input.serves_cuisine.length > 0
        ? input.serves_cuisine
        : undefined,
    acceptsReservations: input.accepts_reservations,
    paymentAccepted: input.payment_accepted,
    currenciesAccepted: input.currencies_accepted,
    hasMap: input.has_map ?? undefined,
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
  // Google recommends ≥3 real photos of the venue (façade / intérieur /
  // produits), multiple aspect ratios. Only one atelier photo exists today.
  image: [
    "https://lehena.fr/images/home-atelier.webp",
    // TODO_PHOTOS_ATELIER (Paul): héberger des photos dédiées dans
    // apps/storefront/public/images/ (façade, intérieur, jambons) et
    // ajouter leurs URLs absolues ici.
  ],
  // Téléphone public inconnu → champ omis (le helper omet `telephone` quand
  // il est undefined). NE PAS émettre de faux numéro.
  telephone:
    undefined /* TODO_PHONE (Paul): numéro public au format E.164, ex "+33559XXXXXX" */,
  email: "contact@lehena.fr",
  price_range: "€€€",
  // NAP aligné sur apps/storefront/src/lib/company.ts (COMPANY.address).
  address: {
    streetAddress: "Le Bourg",
    addressLocality: "Laguinge-Restoue",
    postalCode: "64470",
    addressRegion: "Pyrénées-Atlantiques",
    addressCountry: "FR",
  },
  geo: {
    // Coordonnées réelles de Laguinge-Restoue (64470) via Nominatim
    // OpenStreetMap (2026-07-21). À affiner sur le point exact de l'atelier
    // si besoin, mais suffisamment précis pour l'encart carte.
    latitude: 43.0972755,
    longitude: -0.8484849,
  },
  opening_hours: [
    /* TODO: confirmer horaires réelles avec Paul (vente directe / atelier). */
    {
      days: ["Sa"],
      opens: "09:00",
      closes: "13:00",
    },
  ],
  area_served: [
    { type: "AdministrativeArea", name: "Pays Basque" },
    { type: "AdministrativeArea", name: "Béarn" },
    { type: "Country", name: "France" },
  ],
  serves_cuisine: ["Charcuterie", "Basque", "Sud-Ouest"],
  accepts_reservations: false,
  payment_accepted: "Cash, Credit Card, Contactless",
  currencies_accepted: "EUR",
  // Google Business Profile pas encore relié → hasMap omis.
  has_map:
    undefined /* TODO_GBP_CID (Paul): "https://maps.google.com/?cid=<CID_GBP>" */,
  same_as: [
    "https://www.instagram.com/maison.lehena",
    "https://www.facebook.com/maison.lehena",
    // TODO_GBP_CID (Paul): ajouter "https://maps.google.com/?cid=<CID_GBP>"
    // une fois la fiche Google Business Profile reliée.
  ],
}
