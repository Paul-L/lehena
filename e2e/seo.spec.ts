import { expect, test } from "@playwright/test"

/**
 * SEO contract — these are the bits that quietly break and silently
 * tank organic traffic. Every PR runs them.
 */

test("home: title + meta description + canonical present", async ({ page }) => {
  await page.goto("/fr")
  await expect(page).toHaveTitle(/Lehena/i)
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute("content")
  expect(description?.length ?? 0).toBeGreaterThan(50)
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href")
  expect(canonical).toBeTruthy()
})

test("sitemap.xml is a sitemapindex pointing at 4 segments", async ({
  request,
}) => {
  const res = await request.get("/sitemap.xml")
  expect(res.ok()).toBeTruthy()
  const body = await res.text()
  expect(body).toContain("<sitemapindex")
  expect(body).toContain("/sitemap-pages.xml")
  expect(body).toContain("/sitemap-products.xml")
  expect(body).toContain("/sitemap-categories.xml")
  expect(body).toContain("/sitemap-articles.xml")
})

test("robots.txt allows / and disallows /api + /account", async ({
  request,
}) => {
  const res = await request.get("/robots.txt")
  expect(res.ok()).toBeTruthy()
  const body = await res.text()
  expect(body).toMatch(/Allow:\s*\//)
  expect(body).toContain("/api/")
  expect(body).toMatch(/\/account/i)
  expect(body).toContain("Sitemap:")
})

test("PDP exposes Product JSON-LD with offers", async ({ page }) => {
  await page.goto("/fr/store")
  await page.locator('[data-testid="product-wrapper"]').first().click()
  // The JsonLd wrapper renders a <script type="application/ld+json">
  // tag carrying the schema.
  const handles = await page.locator('script[type="application/ld+json"]').all()
  const blobs = await Promise.all(handles.map((h) => h.textContent()))
  const productSchema = blobs.find((b) => b?.includes('"@type":"Product"'))
  expect(productSchema).toBeTruthy()
  expect(productSchema).toContain('"offers"')
})
