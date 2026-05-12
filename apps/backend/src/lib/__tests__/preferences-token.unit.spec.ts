import { describe, expect, it } from "@jest/globals"

import {
  signPreferencesToken,
  verifyPreferencesToken,
} from "../preferences-token"

const ORIG_SECRET = process.env.JWT_SECRET

describe("preferences-token", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-min-32-chars-long-please"
  })
  afterAll(() => {
    if (ORIG_SECRET === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = ORIG_SECRET
    }
  })

  it("round-trips a valid email", () => {
    const token = signPreferencesToken("paul@example.com")
    expect(verifyPreferencesToken(token)).toBe("paul@example.com")
  })

  it("rejects a tampered token", () => {
    const token = signPreferencesToken("paul@example.com")
    const tampered = token.slice(0, -3) + "XXX"
    expect(verifyPreferencesToken(tampered)).toBeNull()
  })

  it("rejects a token signed with the wrong secret", () => {
    const token = signPreferencesToken("paul@example.com")
    process.env.JWT_SECRET = "different-secret-also-32-chars-long"
    expect(verifyPreferencesToken(token)).toBeNull()
    process.env.JWT_SECRET = "test-secret-min-32-chars-long-please"
  })

  it("rejects bogus tokens", () => {
    expect(verifyPreferencesToken("not-a-jwt")).toBeNull()
    expect(verifyPreferencesToken("")).toBeNull()
  })
})
