/**
 * Mapping between `countryCode` (Medusa region/route segment) and `locale`
 * (Page model + content). The site is FR-first; markets that share a language
 * with another region map to that language.
 *
 * If a countryCode is missing here, we fall back to "fr".
 */
const COUNTRY_TO_LOCALE: Record<string, string> = {
  fr: "fr",
  be: "fr",
  ch: "fr",
  ca: "fr",
  lu: "fr",
  mc: "fr",
  es: "es",
  ad: "es",
  mx: "es",
  ar: "es",
  cl: "es",
  pe: "es",
  uy: "es",
  gb: "en",
  uk: "en",
  us: "en",
  ie: "en",
  au: "en",
  nz: "en",
  ca_en: "en", // explicit for Anglophone Canada if ever needed
}

const LOCALES = ["fr", "es", "en"] as const
export type Locale = (typeof LOCALES)[number]
export const SUPPORTED_LOCALES: readonly Locale[] = LOCALES

export function localeForCountry(countryCode: string): Locale {
  const lc = countryCode.toLowerCase()
  const found = COUNTRY_TO_LOCALE[lc]
  return (found as Locale) ?? "fr"
}

/**
 * Returns one representative country code per supported locale. Used to build
 * hreflang alternates without enumerating every country in the region table.
 * Order matches the SUPPORTED_LOCALES tuple.
 */
export function countryForLocale(locale: Locale): string {
  switch (locale) {
    case "fr":
      return "fr"
    case "es":
      return "es"
    case "en":
      return "gb"
  }
}

/** Map a locale to a BCP-47 region tag used in hreflang. */
export function hreflangForLocale(locale: Locale): string {
  switch (locale) {
    case "fr":
      return "fr-FR"
    case "es":
      return "es-ES"
    case "en":
      return "en-GB"
  }
}
