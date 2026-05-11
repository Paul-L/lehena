import { describe, expect, it } from "@jest/globals"

import {
  FaqItemCreateSchema,
  FaqItemUpdateSchema,
  FaqItemsReorderSchema,
} from "../types"

describe("FaqItemCreateSchema", () => {
  it("accepts a minimal valid item", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "Quelle est la durée de conservation ?",
      answer: "Six mois minimum avant ouverture.",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.position).toBe(0)
    }
  })

  it("rejects an empty question", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "",
      answer: "Une réponse correcte.",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a question over 200 chars", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "x".repeat(201),
      answer: "Une réponse correcte.",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an answer over 2000 chars", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "Q",
      answer: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects unknown keys (strict)", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "Q valide",
      answer: "A valide",
      unknown_key: "x",
    })
    expect(result.success).toBe(false)
  })

  it("accepts position 0", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "Q valide",
      answer: "A valide",
      position: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative position", () => {
    const result = FaqItemCreateSchema.safeParse({
      question: "Q valide",
      answer: "A valide",
      position: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("FaqItemUpdateSchema", () => {
  it("accepts a partial update", () => {
    const result = FaqItemUpdateSchema.safeParse({ position: 5 })
    expect(result.success).toBe(true)
  })

  it("accepts an empty update (all fields optional)", () => {
    const result = FaqItemUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects unknown keys (strict)", () => {
    const result = FaqItemUpdateSchema.safeParse({ foo: "bar" })
    expect(result.success).toBe(false)
  })
})

describe("FaqItemsReorderSchema", () => {
  it("accepts a valid reorder payload", () => {
    const result = FaqItemsReorderSchema.safeParse({
      items: [
        { id: "fi_1", position: 0 },
        { id: "fi_2", position: 1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty items array", () => {
    const result = FaqItemsReorderSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it("rejects more than 50 items", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      id: `fi_${i}`,
      position: i,
    }))
    const result = FaqItemsReorderSchema.safeParse({ items })
    expect(result.success).toBe(false)
  })

  it("rejects items missing an id", () => {
    const result = FaqItemsReorderSchema.safeParse({
      items: [{ position: 0 }],
    })
    expect(result.success).toBe(false)
  })
})
