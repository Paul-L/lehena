import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

const ADMIN_EMAIL = "store-pages-test@medusa.local"
const ADMIN_PASSWORD = "test-password-123"
const PREVIEW_SECRET = "test-preview-secret"

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

async function createPublishableKey(
  api: any,
  adminToken: string
): Promise<string> {
  const resp = await api.post(
    "/admin/api-keys",
    { title: "Test Publishable Key", type: "publishable" },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  )
  return resp.data.api_key.token
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    PREVIEW_SECRET,
  },
  testSuite: ({ api }) => {
    let adminToken: string
    let publishableKey: string
    let publishedId: string
    let draftSlug = "draft-page"
    let publishedSlug = "published-page"

    beforeAll(async () => {
      adminToken = await loginAsAdmin(api)
      publishableKey = await createPublishableKey(api, adminToken)
      const adminHeaders = { Authorization: `Bearer ${adminToken}` }

      // Create a published page (FR)
      const created = await api.post(
        "/admin/pages",
        {
          slug: publishedSlug,
          title: "Published page",
          locale: "fr",
          content: { type: "doc", content: [] },
        },
        { headers: adminHeaders }
      )
      publishedId = created.data.page.id
      await api.post(
        `/admin/pages/${publishedId}/publish`,
        {},
        { headers: adminHeaders }
      )

      // Create a draft page (FR)
      await api.post(
        "/admin/pages",
        {
          slug: draftSlug,
          title: "Draft page",
          locale: "fr",
        },
        { headers: adminHeaders }
      )
    })

    describe("store pages — list", () => {
      it("returns only published pages (no content field)", async () => {
        const resp = await api.get("/store/pages", {
          headers: { "x-publishable-api-key": publishableKey },
        })
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({
          count: expect.any(Number),
          limit: expect.any(Number),
          offset: 0,
        })
        const slugs = resp.data.pages.map((p: any) => p.slug)
        expect(slugs).toContain(publishedSlug)
        expect(slugs).not.toContain(draftSlug)
        for (const page of resp.data.pages) {
          expect(page.content).toBeUndefined()
          expect(page.status).toBeUndefined()
        }
      })

      it("filters by locale via ?locale= (consumed by applyLocale middleware)", async () => {
        const resp = await api.get("/store/pages?locale=en", {
          headers: { "x-publishable-api-key": publishableKey },
        })
        expect(resp.status).toBe(200)
        expect(resp.data.count).toBe(0)
      })

      it("rejects unrecognized query fields (400)", async () => {
        const resp = await api
          .get("/store/pages?foo=bar", {
            headers: { "x-publishable-api-key": publishableKey },
          })
          .catch((e) => e.response)
        expect(resp.status).toBe(400)
      })
    })

    describe("store pages — by slug", () => {
      it("returns 200 for a published page", async () => {
        const resp = await api.get(`/store/pages/${publishedSlug}`, {
          headers: { "x-publishable-api-key": publishableKey },
        })
        expect(resp.status).toBe(200)
        expect(resp.data.page).toMatchObject({
          slug: publishedSlug,
          status: "published",
        })
      })

      it("returns 404 for an unknown slug", async () => {
        const resp = await api
          .get("/store/pages/does-not-exist", {
            headers: { "x-publishable-api-key": publishableKey },
          })
          .catch((e) => e.response)
        expect(resp.status).toBe(404)
        expect(resp.data.type).toBe("not_found")
      })

      it("returns 404 for a draft without preview token", async () => {
        const resp = await api
          .get(`/store/pages/${draftSlug}`, {
            headers: { "x-publishable-api-key": publishableKey },
          })
          .catch((e) => e.response)
        expect(resp.status).toBe(404)
      })

      it("returns 200 for a draft with valid x-preview-token", async () => {
        const resp = await api.get(`/store/pages/${draftSlug}`, {
          headers: {
            "x-publishable-api-key": publishableKey,
            "x-preview-token": PREVIEW_SECRET,
          },
        })
        expect(resp.status).toBe(200)
        expect(resp.data.page.slug).toBe(draftSlug)
        expect(resp.data.page.status).toBe("draft")
      })

      it("returns 404 for a draft with wrong preview token", async () => {
        const resp = await api
          .get(`/store/pages/${draftSlug}`, {
            headers: {
              "x-publishable-api-key": publishableKey,
              "x-preview-token": "wrong-secret",
            },
          })
          .catch((e) => e.response)
        expect(resp.status).toBe(404)
      })
    })
  },
})
