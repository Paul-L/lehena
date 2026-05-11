import {
  CatalogAdditionalDataSchema,
  ProductDetailsInputSchema,
  VariantDetailsInputSchema,
} from "../types"

describe("catalog/types — ProductDetailsInputSchema", () => {
  const validInput = {
    origin: "Iparralde" as const,
    breed: "Duroc" as const,
    allergens: [],
    nitrite_free: true,
    conservation_temp: "fresh" as const,
    ddm_days: 60,
    aging_months: 24,
    ingredients: "Viande de porc Duroc (98%), sel de Salies-de-Béarn (2%).",
  }

  test("accepts a minimal valid product detail", () => {
    const result = ProductDetailsInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  test("applies defaults for allergens / nitrite_free / noindex / pairings_tags", () => {
    const result = ProductDetailsInputSchema.safeParse({
      origin: "France" as const,
      ddm_days: 30,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.allergens).toEqual([])
      expect(result.data.nitrite_free).toBe(false)
      expect(result.data.noindex).toBe(false)
      expect(result.data.pairings_tags).toEqual([])
      expect(result.data.conservation_temp).toBe("ambient")
    }
  })

  test("rejects negative aging_months", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      aging_months: -1,
    })
    expect(result.success).toBe(false)
  })

  test("rejects unknown origin", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      origin: "Patagonie",
    })
    expect(result.success).toBe(false)
  })

  test("rejects unknown allergen", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      allergens: ["gluten", "kryptonite"],
    })
    expect(result.success).toBe(false)
  })

  test("accepts up to 10 years of ddm_days", () => {
    const ok = ProductDetailsInputSchema.safeParse({
      ...validInput,
      ddm_days: 3650,
    })
    expect(ok.success).toBe(true)
    const tooLong = ProductDetailsInputSchema.safeParse({
      ...validInput,
      ddm_days: 3651,
    })
    expect(tooLong.success).toBe(false)
  })

  test("rejects seo_title longer than 60 chars", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      seo_title: "x".repeat(61),
    })
    expect(result.success).toBe(false)
  })

  test("rejects malformed og_image_url", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      og_image_url: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  test("rejects unknown nutritional keys (strict mode)", () => {
    const result = ProductDetailsInputSchema.safeParse({
      ...validInput,
      nutritional: { energy_kcal: 200, vitamins: { c: 10 } },
    })
    expect(result.success).toBe(false)
  })
})

describe("catalog/types — VariantDetailsInputSchema", () => {
  test("accepts a valid variant", () => {
    const result = VariantDetailsInputSchema.safeParse({
      sku: "ORHI24-DEMI",
      weight_grams: 3000,
      format: "demi",
    })
    expect(result.success).toBe(true)
  })

  test("rejects zero weight", () => {
    const result = VariantDetailsInputSchema.safeParse({
      sku: "X",
      weight_grams: 0,
      format: "demi",
    })
    expect(result.success).toBe(false)
  })

  test("rejects unknown format", () => {
    const result = VariantDetailsInputSchema.safeParse({
      sku: "X",
      weight_grams: 1000,
      format: "salami_geant",
    })
    expect(result.success).toBe(false)
  })
})

describe("catalog/types — CatalogAdditionalDataSchema (wrapper)", () => {
  test("variants default to empty array", () => {
    const result = CatalogAdditionalDataSchema.safeParse({
      product: { origin: "France", ddm_days: 30 },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.variants).toEqual([])
    }
  })

  test("rejects extra root keys (strict)", () => {
    const result = CatalogAdditionalDataSchema.safeParse({
      product: { origin: "France", ddm_days: 30 },
      foo: "bar",
    })
    expect(result.success).toBe(false)
  })
})
