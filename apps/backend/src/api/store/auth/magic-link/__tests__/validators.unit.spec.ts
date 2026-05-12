import { describe, expect, it } from "@jest/globals"

import { RequestMagicLinkSchema, VerifyMagicLinkSchema } from "../validators"

describe("RequestMagicLinkSchema", () => {
  it("accepts a valid email", () => {
    expect(
      RequestMagicLinkSchema.safeParse({ email: "jean@example.com" }).success
    ).toBe(true)
  })
  it("rejects an invalid email", () => {
    expect(
      RequestMagicLinkSchema.safeParse({ email: "not-an-email" }).success
    ).toBe(false)
  })
  it("rejects an oversized email", () => {
    expect(
      RequestMagicLinkSchema.safeParse({ email: `${"x".repeat(201)}@x.com` })
        .success
    ).toBe(false)
  })
})

describe("VerifyMagicLinkSchema", () => {
  it("requires a token of at least 20 chars", () => {
    expect(VerifyMagicLinkSchema.safeParse({ token: "short" }).success).toBe(
      false
    )
  })
  it("accepts a long opaque token", () => {
    expect(
      VerifyMagicLinkSchema.safeParse({ token: "x".repeat(120) }).success
    ).toBe(true)
  })
  it("rejects tokens past 2000 chars", () => {
    expect(
      VerifyMagicLinkSchema.safeParse({ token: "x".repeat(2001) }).success
    ).toBe(false)
  })
})
