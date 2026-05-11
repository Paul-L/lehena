import { CreateRedirectInputSchema, buildResourcePath } from "../types"

describe("redirects/types — CreateRedirectInputSchema", () => {
  test("accepts a minimal manual redirect (defaults applied)", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "/produits/ancien",
      to_path: "/produits/nouveau",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe(301)
      expect(result.data.source).toBe("manual")
    }
  })

  test("rejects when from_path === to_path", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "/x",
      to_path: "/x",
    })
    expect(result.success).toBe(false)
  })

  test("rejects relative paths", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "produits/ancien",
      to_path: "/produits/nouveau",
    })
    expect(result.success).toBe(false)
  })

  test("rejects unknown status code", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "/a",
      to_path: "/b",
      status: 404,
    })
    expect(result.success).toBe(false)
  })

  test("accepts 307 and 308 redirect codes", () => {
    expect(
      CreateRedirectInputSchema.safeParse({
        from_path: "/a",
        to_path: "/b",
        status: 307,
      }).success
    ).toBe(true)
    expect(
      CreateRedirectInputSchema.safeParse({
        from_path: "/a",
        to_path: "/b",
        status: 308,
      }).success
    ).toBe(true)
  })

  test("rejects extra fields (strict)", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "/a",
      to_path: "/b",
      foo: true,
    })
    expect(result.success).toBe(false)
  })

  test("rejects note longer than 500 chars", () => {
    const result = CreateRedirectInputSchema.safeParse({
      from_path: "/a",
      to_path: "/b",
      note: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe("redirects/types — buildResourcePath", () => {
  test("builds product paths", () => {
    expect(buildResourcePath("product", "jambon-orhi-24")).toBe(
      "/produits/jambon-orhi-24"
    )
  })

  test("builds category paths", () => {
    expect(buildResourcePath("category", "jambons-iparralde")).toBe(
      "/categories/jambons-iparralde"
    )
  })

  test("page paths leave no prefix", () => {
    expect(buildResourcePath("page", "notre-histoire")).toBe("/notre-histoire")
  })
})
