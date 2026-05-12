import { describe, expect, it } from "@jest/globals"

import { colissimoPriceCents, zoneForCountry } from "../pricing"

describe("Colissimo — zoneForCountry", () => {
  it("FR → FR", () => {
    expect(zoneForCountry("fr")).toBe("FR")
  })

  it("DE / IT / ES → EU", () => {
    expect(zoneForCountry("de")).toBe("EU")
    expect(zoneForCountry("it")).toBe("EU")
    expect(zoneForCountry("es")).toBe("EU")
  })

  it("US / JP / GB → WORLD", () => {
    expect(zoneForCountry("us")).toBe("WORLD")
    expect(zoneForCountry("jp")).toBe("WORLD")
    expect(zoneForCountry("gb")).toBe("WORLD")
  })

  it("unsupported countries → OUT_OF_RANGE", () => {
    expect(zoneForCountry("xx")).toBe("OUT_OF_RANGE")
    expect(zoneForCountry("")).toBe("OUT_OF_RANGE")
  })
})

describe("Colissimo — colissimoPriceCents", () => {
  it("returns price tiers for FR", () => {
    expect(colissimoPriceCents("FR", 500)).toBe(690)
    expect(colissimoPriceCents("FR", 2000)).toBe(690)
    expect(colissimoPriceCents("FR", 2001)).toBe(990)
    expect(colissimoPriceCents("FR", 12000)).toBe(1790)
    expect(colissimoPriceCents("FR", 30000)).toBe(2490)
  })

  it("returns price tiers for EU", () => {
    expect(colissimoPriceCents("EU", 500)).toBe(1490)
    expect(colissimoPriceCents("EU", 10001)).toBe(4490)
  })

  it("returns price tiers for WORLD", () => {
    expect(colissimoPriceCents("WORLD", 500)).toBe(2990)
    expect(colissimoPriceCents("WORLD", 7500)).toBe(7990)
  })

  it("returns null for OUT_OF_RANGE", () => {
    expect(colissimoPriceCents("OUT_OF_RANGE", 100)).toBeNull()
  })
})
