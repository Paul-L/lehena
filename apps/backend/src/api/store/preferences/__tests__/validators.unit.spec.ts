import { describe, expect, it } from "@jest/globals"

import { UnsubscribeSchema } from "../validators"

describe("UnsubscribeSchema", () => {
  it("requires a token", () => {
    expect(UnsubscribeSchema.safeParse({}).success).toBe(false)
  })
  it("rejects a token shorter than 20 chars", () => {
    expect(UnsubscribeSchema.safeParse({ token: "short" }).success).toBe(false)
  })
  it("accepts a JWT-shaped token", () => {
    expect(
      UnsubscribeSchema.safeParse({ token: "x".repeat(200) }).success
    ).toBe(true)
  })
  it("rejects tokens over 2000 chars", () => {
    expect(
      UnsubscribeSchema.safeParse({ token: "x".repeat(2001) }).success
    ).toBe(false)
  })
})
