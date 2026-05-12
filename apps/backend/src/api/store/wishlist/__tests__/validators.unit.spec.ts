import { describe, expect, it } from "@jest/globals"

import { AddWishlistItemSchema } from "../validators"

describe("AddWishlistItemSchema", () => {
  it("accepts a minimal product_id", () => {
    expect(
      AddWishlistItemSchema.safeParse({ product_id: "prod_01" }).success
    ).toBe(true)
  })
  it("accepts a product_id + variant_id", () => {
    expect(
      AddWishlistItemSchema.safeParse({
        product_id: "prod_01",
        variant_id: "variant_03",
      }).success
    ).toBe(true)
  })
  it("rejects an empty product_id", () => {
    expect(AddWishlistItemSchema.safeParse({ product_id: "" }).success).toBe(
      false
    )
  })
  it("accepts a null variant_id explicitly", () => {
    expect(
      AddWishlistItemSchema.safeParse({
        product_id: "prod_01",
        variant_id: null,
      }).success
    ).toBe(true)
  })
})
