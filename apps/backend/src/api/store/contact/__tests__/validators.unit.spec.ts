import { describe, expect, it } from "@jest/globals"

import { SubmitContactSchema } from "../validators"

describe("SubmitContactSchema", () => {
  const valid = {
    name: "Marie Dupont",
    email: "marie@example.com",
    subject: "Question sur livraison",
    message: "Bonjour, j'aimerais savoir si vous livrez en Corse.",
  }

  it("accepts a minimal valid payload", () => {
    const result = SubmitContactSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("rejects a malformed email", () => {
    const result = SubmitContactSchema.safeParse({
      ...valid,
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a message shorter than 10 chars", () => {
    const result = SubmitContactSchema.safeParse({
      ...valid,
      message: "short",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a message longer than 5000 chars", () => {
    const result = SubmitContactSchema.safeParse({
      ...valid,
      message: "x".repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it("rejects an empty subject", () => {
    const result = SubmitContactSchema.safeParse({ ...valid, subject: "" })
    expect(result.success).toBe(false)
  })

  it("accepts an optional locale + source_slug", () => {
    const result = SubmitContactSchema.safeParse({
      ...valid,
      locale: "es",
      source_slug: "contact",
    })
    expect(result.success).toBe(true)
  })

  it("rejects locale shorter than 2 chars", () => {
    const result = SubmitContactSchema.safeParse({ ...valid, locale: "f" })
    expect(result.success).toBe(false)
  })
})
