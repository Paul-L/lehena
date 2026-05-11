import { describe, expect, it } from "@jest/globals"

import {
  CreatePageSchema,
  TranslatePageSchema,
  UpdatePageSchema,
} from "../validators"

describe("CreatePageSchema — Phase 4 SEO + i18n fields", () => {
  const base = {
    slug: "notre-histoire",
    title: "Notre histoire",
  }

  it("accepts noindex + canonical_override + translation_group_id", () => {
    const result = CreatePageSchema.safeParse({
      ...base,
      noindex: true,
      canonical_override: "https://example.com/canonical",
      translation_group_id: "550e8400-e29b-41d4-a716-446655440000",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a non-url canonical_override", () => {
    const result = CreatePageSchema.safeParse({
      ...base,
      canonical_override: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-uuid translation_group_id", () => {
    const result = CreatePageSchema.safeParse({
      ...base,
      translation_group_id: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("accepts null translation_group_id", () => {
    const result = CreatePageSchema.safeParse({
      ...base,
      translation_group_id: null,
    })
    expect(result.success).toBe(true)
  })

  it("accepts an unset noindex (default false at the model level)", () => {
    const result = CreatePageSchema.safeParse(base)
    expect(result.success).toBe(true)
  })
})

describe("UpdatePageSchema — Phase 4 fields", () => {
  it("accepts a partial update with only noindex", () => {
    const result = UpdatePageSchema.safeParse({ noindex: true })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid canonical_override on update", () => {
    const result = UpdatePageSchema.safeParse({
      canonical_override: "bad",
    })
    expect(result.success).toBe(false)
  })
})

describe("TranslatePageSchema", () => {
  it("requires target_locale", () => {
    const result = TranslatePageSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("accepts target_locale alone (slug auto-derived in workflow)", () => {
    const result = TranslatePageSchema.safeParse({ target_locale: "es" })
    expect(result.success).toBe(true)
  })

  it("accepts target_locale + custom slug", () => {
    const result = TranslatePageSchema.safeParse({
      target_locale: "es",
      slug: "nuestra-historia",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty target_locale", () => {
    const result = TranslatePageSchema.safeParse({ target_locale: "" })
    expect(result.success).toBe(false)
  })
})
