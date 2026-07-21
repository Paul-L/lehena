/**
 * schema.org OfferShippingDetails — required alongside MerchantReturnPolicy
 * for Google Product rich results. Lehena default: free shipping above a
 * configurable threshold, FR destination, 0-1 day handling, 1-2 day transit.
 */
export interface MonetaryAmountSchema {
  "@type": "MonetaryAmount"
  value: string
  currency: string
}

export interface DefinedRegionSchema {
  "@type": "DefinedRegion"
  addressCountry: string
}

export interface QuantitativeValueSchema {
  "@type": "QuantitativeValue"
  minValue: number
  maxValue: number
  unitCode: string
}

export interface ShippingDeliveryTimeSchema {
  "@type": "ShippingDeliveryTime"
  handlingTime: QuantitativeValueSchema
  transitTime: QuantitativeValueSchema
}

export interface OfferShippingDetailsSchema {
  "@type": "OfferShippingDetails"
  shippingRate: MonetaryAmountSchema
  shippingDestination: DefinedRegionSchema
  deliveryTime: ShippingDeliveryTimeSchema
}

interface ShippingOptions {
  /** Shipping rate value used in the schema (default free: "0.00"). */
  rate?: number
  /** ISO currency code. Default EUR. */
  currency?: string
  /** Destination country. Default FR. */
  country?: string
}

export function offerShippingDetails(
  opts: ShippingOptions = {}
): OfferShippingDetailsSchema {
  const { rate = 0, currency = "EUR", country = "FR" } = opts
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: rate.toFixed(2),
      currency,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: country,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitCode: "DAY",
      },
    },
  }
}
