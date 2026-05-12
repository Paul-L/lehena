import { describe, expect, it } from "@jest/globals"

import {
  chronofreshPriceCents,
  freeShippingThresholdCents,
  zoneForCountry,
} from "../pricing"

describe("Chronofresh — zoneForCountry", () => {
  it("FR → FR (Corsica is filtered upstream by postcode)", () => {
    expect(zoneForCountry("fr")).toBe("FR")
    expect(zoneForCountry("FR")).toBe("FR")
  })

  it("BE / LU / NL → EU_FROID", () => {
    expect(zoneForCountry("be")).toBe("EU_FROID")
    expect(zoneForCountry("lu")).toBe("EU_FROID")
    expect(zoneForCountry("nl")).toBe("EU_FROID")
  })

  it("ES / PT → EU_FROID", () => {
    expect(zoneForCountry("es")).toBe("EU_FROID")
    expect(zoneForCountry("pt")).toBe("EU_FROID")
  })

  it("unsupported countries → OUT_OF_RANGE", () => {
    expect(zoneForCountry("us")).toBe("OUT_OF_RANGE")
    expect(zoneForCountry("jp")).toBe("OUT_OF_RANGE")
    expect(zoneForCountry("")).toBe("OUT_OF_RANGE")
    expect(zoneForCountry(null)).toBe("OUT_OF_RANGE")
  })
})

describe("Chronofresh — chronofreshPriceCents", () => {
  it("returns price tiers for FR", () => {
    expect(chronofreshPriceCents("FR", 500)).toBe(1500)
    expect(chronofreshPriceCents("FR", 2000)).toBe(1500) // upper bound inclusive
    expect(chronofreshPriceCents("FR", 2001)).toBe(1900) // next tier
    expect(chronofreshPriceCents("FR", 5000)).toBe(1900)
    expect(chronofreshPriceCents("FR", 9999)).toBe(2500)
    expect(chronofreshPriceCents("FR", 25000)).toBe(4900)
  })

  it("returns price tiers for CORSE", () => {
    expect(chronofreshPriceCents("CORSE", 1500)).toBe(2000)
    expect(chronofreshPriceCents("CORSE", 12000)).toBe(4500)
  })

  it("returns price tiers for EU_FROID", () => {
    expect(chronofreshPriceCents("EU_FROID", 500)).toBe(2500)
    expect(chronofreshPriceCents("EU_FROID", 4000)).toBe(3200)
    expect(chronofreshPriceCents("EU_FROID", 11000)).toBe(5900)
  })

  it("returns null for OUT_OF_RANGE", () => {
    expect(chronofreshPriceCents("OUT_OF_RANGE", 500)).toBeNull()
    expect(chronofreshPriceCents("OUT_OF_RANGE", 50000)).toBeNull()
  })

  it("scales by weight, not by item count", () => {
    // Three baskets crossing the 2000g boundary should price tier-by-weight.
    expect(chronofreshPriceCents("FR", 1999)).toBe(1500)
    expect(chronofreshPriceCents("FR", 2001)).toBe(1900)
  })
})

describe("Chronofresh — freeShippingThresholdCents", () => {
  const ORIG = process.env.FREE_SHIPPING_THRESHOLD_CENTS

  afterEach(() => {
    if (ORIG === undefined) {
      delete process.env.FREE_SHIPPING_THRESHOLD_CENTS
    } else {
      process.env.FREE_SHIPPING_THRESHOLD_CENTS = ORIG
    }
  })

  it("defaults to 50 € (5000 cents)", () => {
    delete process.env.FREE_SHIPPING_THRESHOLD_CENTS
    expect(freeShippingThresholdCents()).toBe(5000)
  })

  it("honors a valid env override", () => {
    process.env.FREE_SHIPPING_THRESHOLD_CENTS = "7500"
    expect(freeShippingThresholdCents()).toBe(7500)
  })

  it("falls back to the default on garbage input", () => {
    process.env.FREE_SHIPPING_THRESHOLD_CENTS = "lol"
    expect(freeShippingThresholdCents()).toBe(5000)
    process.env.FREE_SHIPPING_THRESHOLD_CENTS = "-1"
    expect(freeShippingThresholdCents()).toBe(5000)
  })
})
