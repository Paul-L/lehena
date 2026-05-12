import { describe, expect, it } from "@jest/globals"

import { ExportOrdersSchema } from "../validators"

describe("ExportOrdersSchema", () => {
  it("accepts from + to", () => {
    expect(
      ExportOrdersSchema.safeParse({
        from: "2026-01-01",
        to: "2026-01-31",
      }).success
    ).toBe(true)
  })
  it("requires both dates", () => {
    expect(ExportOrdersSchema.safeParse({ from: "2026-01-01" }).success).toBe(
      false
    )
  })
  it("accepts a status filter", () => {
    expect(
      ExportOrdersSchema.safeParse({
        from: "2026-01-01",
        to: "2026-01-31",
        status: ["completed", "pending"],
      }).success
    ).toBe(true)
  })
  it("rejects an unknown status", () => {
    expect(
      ExportOrdersSchema.safeParse({
        from: "2026-01-01",
        to: "2026-01-31",
        status: ["paid"],
      }).success
    ).toBe(false)
  })
})
