import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

import {
  chronofreshPriceCents,
  CHRONOFRESH_PROVIDER_ID,
  freeShippingThresholdCents,
  zoneForCountry,
  type ChronofreshZone,
} from "./pricing"

import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  FulfillmentOption,
  ValidateFulfillmentDataContext,
} from "@medusajs/types"

/**
 * Chronofresh — cold-chain fulfillment provider for Lehena.
 *
 * Pricing is computed from a local grid (`pricing.ts`) keyed by destination
 * zone + total cart weight. The real Chronofresh API (label printing,
 * tracking, pickup scheduling) is wired post-launch once the commercial
 * contract is signed — at that point, `createFulfillment` will call the API
 * and return a real label, but the price grid stays as the source of truth
 * for what we charge the customer.
 *
 * Free shipping over a threshold (default 50 € TTC, configurable) is applied
 * inside `calculatePrice` so it works for every Chronofresh shipping option
 * without needing per-option business rules.
 *
 * Mixed-cart enforcement (cart contains both fresh and ambient items → must
 * ship in Chronofresh) is handled at the storefront filter level, not here —
 * this provider only knows how to price fresh shipments.
 */
export class ChronofreshFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = CHRONOFRESH_PROVIDER_ID

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    // We expose a single "standard" option per zone; the zone is resolved at
    // calculatePrice time from the shipping address. The shipping option
    // rows in the DB are what differentiate by name in the storefront.
    return [
      { id: "chronofresh-standard" },
      { id: "chronofresh-standard-return", is_return: true },
    ]
  }

  async validateFulfillmentData(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: ValidateFulfillmentDataContext
  ): Promise<Record<string, unknown>> {
    return data
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  async calculatePrice(
    _optionData: Record<string, unknown>,
    _data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    const items = context.items ?? []
    const totalGrams = items.reduce((sum, it) => {
      const w = it.variant?.weight ?? 0
      const qty = (it as { quantity?: number }).quantity ?? 1
      return sum + w * qty
    }, 0)

    const countryCode = context.shipping_address?.country_code ?? null
    const postal = context.shipping_address?.postal_code ?? ""
    // Corsica is country "fr" but postal codes start with "20".
    const zone: ChronofreshZone =
      countryCode === "fr" && postal.startsWith("20")
        ? "CORSE"
        : zoneForCountry(countryCode)

    // Free shipping kicks in at the cart subtotal. We use `item.subtotal` if
    // present (TTC by default in Medusa v2 when prices are tax-inclusive,
    // which is the convention for FR retail). Falling back to unit_price ×
    // quantity keeps the calculation defensive when totals haven't run yet.
    const cartSubtotal = items.reduce((sum, it) => {
      const itAny = it as {
        subtotal?: number
        unit_price?: number
        quantity?: number
      }
      const subtotal =
        itAny.subtotal ?? (itAny.unit_price ?? 0) * (itAny.quantity ?? 1)
      return sum + subtotal
    }, 0)
    const threshold = freeShippingThresholdCents()
    if (cartSubtotal >= threshold) {
      return {
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      }
    }

    const amount = chronofreshPriceCents(zone, totalGrams)
    if (amount === null) {
      // OUT_OF_RANGE — Medusa expects a number; we surface a deliberately
      // very high price (€999) so the option is visible but obviously
      // unusable. The storefront filter should hide it for these countries.
      return {
        calculated_amount: 99900,
        is_calculated_price_tax_inclusive: true,
      }
    }
    return {
      calculated_amount: amount,
      is_calculated_price_tax_inclusive: true,
    }
  }

  async createFulfillment(): Promise<CreateFulfillmentResult> {
    // Stub: real Chronofresh API integration (label PDF + tracking number)
    // is post-launch. For now we emit an empty result; the manual workflow
    // takes over (operator prints the label by hand and updates tracking
    // via the admin UI).
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(): Promise<Record<string, unknown>> {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }
}

export default ChronofreshFulfillmentService
