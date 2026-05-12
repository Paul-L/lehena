import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"

import {
  COLISSIMO_PROVIDER_ID,
  colissimoPriceCents,
  freeShippingThresholdCents,
  zoneForCountry,
  type ColissimoZone,
} from "./pricing"

import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceContext,
  CreateFulfillmentResult,
  FulfillmentOption,
  ValidateFulfillmentDataContext,
} from "@medusajs/types"

/**
 * Colissimo — ambient fulfillment provider for Lehena.
 *
 * Same shape as the Chronofresh provider; pricing grid is the only thing
 * that differs (no cold chain, broader country coverage).
 */
export class ColissimoFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = COLISSIMO_PROVIDER_ID

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      { id: "colissimo-standard" },
      { id: "colissimo-standard-return", is_return: true },
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
    const zone: ColissimoZone =
      countryCode === "fr" && postal.startsWith("20")
        ? "CORSE"
        : zoneForCountry(countryCode)

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
    if (cartSubtotal >= freeShippingThresholdCents()) {
      return {
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      }
    }

    const amount = colissimoPriceCents(zone, totalGrams)
    if (amount === null) {
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
    // Real Colissimo API (label PDF + tracking number) is post-launch.
    return { data: {}, labels: [] }
  }

  async cancelFulfillment(): Promise<Record<string, unknown>> {
    return {}
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }
}

export default ColissimoFulfillmentService
