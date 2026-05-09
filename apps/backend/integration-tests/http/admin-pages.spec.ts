import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

const ADMIN_EMAIL = "admin-pages-test@medusa.local"
const ADMIN_PASSWORD = "test-password-123"

async function loginAsAdmin(api: any): Promise<string> {
  const registerResp = await api.post(
    "/auth/user/emailpass/register",
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  )
  const registrationToken = registerResp.data.token

  await api.post(
    "/users",
    { email: ADMIN_EMAIL, first_name: "Test", last_name: "Admin" },
    { headers: { Authorization: `Bearer ${registrationToken}` } }
  )

  const loginResp = await api.post(
    "/auth/user/emailpass",
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  )
  return loginResp.data.token
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    let adminToken: string
    let authHeaders: { Authorization: string }

    beforeAll(async () => {
      adminToken = await loginAsAdmin(api)
      authHeaders = { Authorization: `Bearer ${adminToken}` }
    })

    describe("admin pages — auth", () => {
      it("returns 401 without auth on POST /admin/pages", async () => {
        const resp = await api
          .post(
            "/admin/pages",
            { slug: "no-auth", title: "x" }
          )
          .catch((e) => e.response)
        expect(resp.status).toBe(401)
      })

      it("returns 401 without auth on GET /admin/pages", async () => {
        const resp = await api
          .get("/admin/pages")
          .catch((e) => e.response)
        expect(resp.status).toBe(401)
      })
    })

    describe("admin pages — happy path", () => {
      let createdId: string

      it("creates a page (POST /admin/pages → 200)", async () => {
        const resp = await api.post(
          "/admin/pages",
          {
            slug: "histoire-fr",
            title: "Notre histoire",
            locale: "fr",
            content: { type: "doc", content: [] },
          },
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data.page).toMatchObject({
          slug: "histoire-fr",
          title: "Notre histoire",
          status: "draft",
          locale: "fr",
        })
        expect(resp.data.page.id).toBeDefined()
        createdId = resp.data.page.id
      })

      it("lists pages (GET /admin/pages)", async () => {
        const resp = await api.get(
          "/admin/pages?limit=10",
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({
          count: expect.any(Number),
          limit: 10,
          offset: 0,
        })
        expect(Array.isArray(resp.data.pages)).toBe(true)
      })

      it("retrieves a page (GET /admin/pages/:id)", async () => {
        const resp = await api.get(
          `/admin/pages/${createdId}`,
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data.page.id).toBe(createdId)
      })

      it("publishes a page (POST /admin/pages/:id/publish)", async () => {
        const resp = await api.post(
          `/admin/pages/${createdId}/publish`,
          {},
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data.page.status).toBe("published")
        expect(resp.data.page.published_at).toBeTruthy()
      })

      it("unpublishes a page (POST /admin/pages/:id/unpublish)", async () => {
        const resp = await api.post(
          `/admin/pages/${createdId}/unpublish`,
          {},
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data.page.status).toBe("draft")
      })

      it("soft-deletes a page (DELETE /admin/pages/:id)", async () => {
        const resp = await api.delete(
          `/admin/pages/${createdId}`,
          { headers: authHeaders }
        )
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({
          id: createdId,
          object: "page",
          deleted: true,
        })
      })
    })

    describe("admin pages — validation errors", () => {
      it("rejects an invalid slug format (400)", async () => {
        const resp = await api
          .post(
            "/admin/pages",
            { slug: "Bad Slug", title: "x" },
            { headers: authHeaders }
          )
          .catch((e) => e.response)
        expect(resp.status).toBe(400)
        expect(resp.data.type).toBe("invalid_data")
      })

      it("rejects a reserved slug (400)", async () => {
        const resp = await api
          .post(
            "/admin/pages",
            { slug: "admin", title: "x" },
            { headers: authHeaders }
          )
          .catch((e) => e.response)
        expect(resp.status).toBe(400)
        expect(resp.data.type).toBe("not_allowed")
      })

      it("rejects a duplicate slug (422)", async () => {
        await api.post(
          "/admin/pages",
          { slug: "duplicate-test", title: "first" },
          { headers: authHeaders }
        )
        const resp = await api
          .post(
            "/admin/pages",
            { slug: "duplicate-test", title: "second" },
            { headers: authHeaders }
          )
          .catch((e) => e.response)
        expect(resp.status).toBe(422)
        expect(resp.data.type).toBe("duplicate_error")
      })
    })
  },
})
