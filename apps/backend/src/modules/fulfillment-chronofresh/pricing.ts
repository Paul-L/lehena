/**
 * Chronofresh shipping price grid — fallback when no live API is wired.
 *
 * Source: WooCommerce manual grid currently in production. To be replaced
 * with the Chronofresh API when commercial contracts are signed
 * (CHRONOFRESH_API_URL / CHRONOFRESH_ACCOUNT / CHRONOFRESH_PASSWORD in env).
 *
 * All amounts are in **cents EUR** because Medusa stores money as integer
 * cents on shipping options (matches `data-price-format` rule: stored as-is,
 * never converted).
 */

export const CHRONOFRESH_PROVIDER_ID = "chronofresh"

export type ChronofreshZone = "FR" | "CORSE" | "EU_FROID" | "OUT_OF_RANGE"

/** Country code → zone. */
export function zoneForCountry(
  countryCode: string | null | undefined
): ChronofreshZone {
  const cc = (countryCode ?? "").toLowerCase()
  if (cc === "fr") return "FR"
  // Corsica shares country code "fr" — caller can pre-filter on postcode 20*.
  if (["be", "lu", "nl"].includes(cc)) return "EU_FROID"
  if (["es", "pt"].includes(cc)) return "EU_FROID"
  return "OUT_OF_RANGE"
}

interface PriceTier {
  /** Inclusive lower bound, grams. */
  min_grams: number
  /** Inclusive upper bound, grams. `Infinity` = no upper bound. */
  max_grams: number
  /** Price in cents EUR. */
  amount: number
}

const GRID: Record<ChronofreshZone, PriceTier[]> = {
  FR: [
    { min_grams: 0, max_grams: 2000, amount: 1500 },
    { min_grams: 2001, max_grams: 5000, amount: 1900 },
    { min_grams: 5001, max_grams: 10000, amount: 2500 },
    { min_grams: 10001, max_grams: 20000, amount: 3500 },
    { min_grams: 20001, max_grams: Infinity, amount: 4900 },
  ],
  CORSE: [
    { min_grams: 0, max_grams: 2000, amount: 2000 },
    { min_grams: 2001, max_grams: 5000, amount: 2400 },
    { min_grams: 5001, max_grams: 10000, amount: 3000 },
    { min_grams: 10001, max_grams: Infinity, amount: 4500 },
  ],
  EU_FROID: [
    { min_grams: 0, max_grams: 2000, amount: 2500 },
    { min_grams: 2001, max_grams: 5000, amount: 3200 },
    { min_grams: 5001, max_grams: 10000, amount: 4200 },
    { min_grams: 10001, max_grams: Infinity, amount: 5900 },
  ],
  OUT_OF_RANGE: [], // No Chronofresh service for these countries.
}

/**
 * Returns the price in cents for a given zone + total weight (grams).
 *
 * `null` means "Chronofresh does not ship here" — the storefront should fall
 * back to Colissimo (and reject the cart at checkout if mixed-cart rules
 * require Chronofresh).
 */
export function chronofreshPriceCents(
  zone: ChronofreshZone,
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
 * Free-shipping threshold — applied at the cart subtotal level (TTC).
 *
 * Configurable via env `FREE_SHIPPING_THRESHOLD_CENTS` for ops. Default
 * 50 € (5000 cents).
 */
export function freeShippingThresholdCents(): number {
  const raw = process.env.FREE_SHIPPING_THRESHOLD_CENTS
  const parsed = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5000
}
