import { describe, expect, it } from "@jest/globals"

import {
  ListContactSubmissionsQuerySchema,
  UpdateContactSubmissionSchema,
} from "../validators"

describe("ListContactSubmissionsQuerySchema", () => {
  it("coerces string numbers to integers", () => {
    const result = ListContactSubmissionsQuerySchema.safeParse({
      limit: "20",
      offset: "40",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(40)
    }
  })

  it("accepts a status filter", () => {
    const result = ListContactSubmissionsQuerySchema.safeParse({
      status: "new",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid status", () => {
    const result = ListContactSubmissionsQuerySchema.safeParse({
      status: "archived",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative offset", () => {
    const result = ListContactSubmissionsQuerySchema.safeParse({ offset: "-1" })
    expect(result.success).toBe(false)
  })
})

describe("UpdateContactSubmissionSchema", () => {
  it("requires status", () => {
    const result = UpdateContactSubmissionSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it.each(["new", "read", "replied", "spam"] as const)(
    "accepts status=%s",
    (status) => {
      const result = UpdateContactSubmissionSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  )

  it("rejects an invalid status", () => {
    const result = UpdateContactSubmissionSchema.safeParse({ status: "lol" })
    expect(result.success).toBe(false)
  })
})
