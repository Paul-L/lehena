import { describe, expect, it } from "@jest/globals"

import { MutateSubscriptionSchema, StartCheckoutSchema } from "../validators"

describe("StartCheckoutSchema", () => {
  it("accepts a plan slug", () => {
    expect(
      StartCheckoutSchema.safeParse({ plan_slug: "decouverte" }).success
    ).toBe(true)
  })
  it("rejects empty plan_slug", () => {
    expect(StartCheckoutSchema.safeParse({ plan_slug: "" }).success).toBe(false)
  })
  it("rejects plan_slug longer than 60", () => {
    expect(
      StartCheckoutSchema.safeParse({ plan_slug: "x".repeat(61) }).success
    ).toBe(false)
  })
  it("accepts an optional gift_message", () => {
    expect(
      StartCheckoutSchema.safeParse({
        plan_slug: "gourmet",
        gift_message: "Bon anniversaire",
      }).success
    ).toBe(true)
  })
  it("rejects gift_message longer than 200", () => {
    expect(
      StartCheckoutSchema.safeParse({
        plan_slug: "gourmet",
        gift_message: "x".repeat(201),
      }).success
    ).toBe(false)
  })
})

describe("MutateSubscriptionSchema", () => {
  it.each(["pause", "resume", "cancel"] as const)("accepts kind=%s", (k) => {
    expect(MutateSubscriptionSchema.safeParse({ kind: k }).success).toBe(true)
  })
  it("rejects an unknown kind", () => {
    expect(MutateSubscriptionSchema.safeParse({ kind: "delete" }).success).toBe(
      false
    )
  })
  it("requires kind", () => {
    expect(MutateSubscriptionSchema.safeParse({}).success).toBe(false)
  })
})
