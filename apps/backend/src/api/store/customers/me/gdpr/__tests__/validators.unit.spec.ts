import { describe, expect, it } from "@jest/globals"

import { DeleteConfirmSchema, DeleteRequestSchema } from "../validators"

describe("DeleteRequestSchema", () => {
  it("requires a password", () => {
    expect(DeleteRequestSchema.safeParse({}).success).toBe(false)
  })
  it("accepts password alone", () => {
    expect(DeleteRequestSchema.safeParse({ password: "x" }).success).toBe(true)
  })
  it("accepts optional notes ≤ 2000 chars", () => {
    expect(
      DeleteRequestSchema.safeParse({ password: "x", notes: "raison" }).success
    ).toBe(true)
    expect(
      DeleteRequestSchema.safeParse({
        password: "x",
        notes: "x".repeat(2001),
      }).success
    ).toBe(false)
  })
})

describe("DeleteConfirmSchema", () => {
  it("requires a token", () => {
    expect(DeleteConfirmSchema.safeParse({}).success).toBe(false)
  })
  it("rejects a short token", () => {
    expect(DeleteConfirmSchema.safeParse({ token: "abc" }).success).toBe(false)
  })
  it("accepts a long JWT-shaped token", () => {
    expect(
      DeleteConfirmSchema.safeParse({ token: "x".repeat(200) }).success
    ).toBe(true)
  })
})
