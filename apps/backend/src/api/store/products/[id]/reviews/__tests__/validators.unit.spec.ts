import { describe, expect, it } from "@jest/globals"

import { ListReviewsQuerySchema, SubmitReviewSchema } from "../validators"

describe("SubmitReviewSchema", () => {
  const valid = { rating: 5, body: "Excellent produit, vraiment au top." }

  it("accepts a minimal payload", () => {
    expect(SubmitReviewSchema.safeParse(valid).success).toBe(true)
  })
  it("requires rating between 1 and 5", () => {
    expect(SubmitReviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(
      false
    )
    expect(SubmitReviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(
      false
    )
    expect(
      SubmitReviewSchema.safeParse({ ...valid, rating: 3.5 }).success
    ).toBe(false)
  })
  it("requires body of at least 10 chars", () => {
    expect(
      SubmitReviewSchema.safeParse({ ...valid, body: "too short" }).success
    ).toBe(false)
  })
  it("caps body at 2000 chars", () => {
    expect(
      SubmitReviewSchema.safeParse({ ...valid, body: "x".repeat(2001) }).success
    ).toBe(false)
  })
  it("accepts an optional title ≤120 chars", () => {
    expect(
      SubmitReviewSchema.safeParse({
        ...valid,
        title: "Une dégustation au top",
      }).success
    ).toBe(true)
    expect(
      SubmitReviewSchema.safeParse({ ...valid, title: "x".repeat(121) }).success
    ).toBe(false)
  })
})

describe("ListReviewsQuerySchema", () => {
  it("coerces string limit/offset to numbers", () => {
    const r = ListReviewsQuerySchema.safeParse({ limit: "10", offset: "20" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.limit).toBe(10)
      expect(r.data.offset).toBe(20)
    }
  })
  it("rejects negative offset", () => {
    expect(ListReviewsQuerySchema.safeParse({ offset: "-1" }).success).toBe(
      false
    )
  })
  it("caps limit at 50", () => {
    expect(ListReviewsQuerySchema.safeParse({ limit: "100" }).success).toBe(
      false
    )
  })
})
