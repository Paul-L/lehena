/**
 * Colissimo shipping price grid — ambient goods (epicerie, patxaran).
 *
 * Source: La Poste public tariff. The Colissimo API
 * (COLISSIMO_API_URL / COLISSIMO_ACCOUNT / COLISSIMO_PASSWORD in env) is
 * wired post-launch when the commercial contract is finalised.
 *
 * Amounts in **cents EUR** (no float, no /100 divide ever).
 */

export const COLISSIMO_PROVIDER_ID = "colissimo"

export type ColissimoZone = "FR" | "CORSE" | "EU" | "WORLD" | "OUT_OF_RANGE"

const EU_COUNTRIES = new Set([
  "be",
  "lu",
  "nl",
  "de",
  "es",
  "it",
  "pt",
  "at",
  "ie",
  "fi",
  "se",
  "dk",
  "gr",
  "pl",
  "cz",
  "ee",
  "hu",
  "ro",
  "sk",
  "si",
  "lt",
  "lv",
  "bg",
  "hr",
  "mt",
  "cy",
])

const WORLD_COUNTRIES = new Set([
  "gb",
  "ch",
  "no",
  "us",
  "ca",
  "jp",
  "au",
  "nz",
  "sg",
])

export function zoneForCountry(
  countryCode: string | null | undefined
): ColissimoZone {
  const cc = (countryCode ?? "").toLowerCase()
  if (cc === "fr") return "FR"
  if (EU_COUNTRIES.has(cc)) return "EU"
  if (WORLD_COUNTRIES.has(cc)) return "WORLD"
  return "OUT_OF_RANGE"
}

interface PriceTier {
  min_grams: number
  max_grams: number
  amount: number
}

const GRID: Record<ColissimoZone, PriceTier[]> = {
  FR: [
    { min_grams: 0, max_grams: 2000, amount: 690 },
    { min_grams: 2001, max_grams: 5000, amount: 990 },
    { min_grams: 5001, max_grams: 10000, amount: 1390 },
    { min_grams: 10001, max_grams: 20000, amount: 1790 },
    { min_grams: 20001, max_grams: Infinity, amount: 2490 },
  ],
  CORSE: [
    { min_grams: 0, max_grams: 2000, amount: 890 },
    { min_grams: 2001, max_grams: 5000, amount: 1290 },
    { min_grams: 5001, max_grams: 10000, amount: 1690 },
    { min_grams: 10001, max_grams: Infinity, amount: 2490 },
  ],
  EU: [
    { min_grams: 0, max_grams: 2000, amount: 1490 },
    { min_grams: 2001, max_grams: 5000, amount: 1990 },
    { min_grams: 5001, max_grams: 10000, amount: 2990 },
    { min_grams: 10001, max_grams: Infinity, amount: 4490 },
  ],
  WORLD: [
    { min_grams: 0, max_grams: 2000, amount: 2990 },
    { min_grams: 2001, max_grams: 5000, amount: 4990 },
    { min_grams: 5001, max_grams: 10000, amount: 7990 },
    { min_grams: 10001, max_grams: Infinity, amount: 12990 },
  ],
  OUT_OF_RANGE: [],
}

export function colissimoPriceCents(
  zone: ColissimoZone,
  totalGrams: number
): number | null {
  const tiers = GRID[zone]
  if (tiers.length === 0) return null
  const tier = tiers.find(
    (t) => totalGrams >= t.min_grams && totalGrams <= t.max_grams
  )
  return tier?.amount ?? null
}

/**
 * Re-export the same threshold function so the two providers stay aligned —
 * we deliberately don't have two different env vars for the same business
 * concept.
 */
export { freeShippingThresholdCents } from "../fulfillment-chronofresh/pricing"
