import { expect, test } from "@playwright/test"

/**
 * Critical happy-path smoke: home → category → PDP → add to cart →
 * checkout. This is the single test that MUST stay green if anything
 * about the customer purchase flow is at risk. It does NOT take the
 * Stripe Checkout step to the end (no test cards configured in CI) —
 * the "card refused" variant in `checkout-error.spec.ts` covers that
 * branch with a stubbed Stripe response.
 */
test("happy path: home → PDP → add to cart → checkout step", async ({
  page,
}) => {
  // 1) Land on home
  await page.goto("/fr")
  await expect(page).toHaveTitle(/Lehena/i)

  // 2) Open a category listing
  await page
    .getByRole("link", { name: /Boutique/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/fr\/store/)
  await expect(
    page.locator('[data-testid="product-wrapper"]').first()
  ).toBeVisible()

  // 3) Open the first product
  await page.locator('[data-testid="product-wrapper"]').first().click()
  await expect(page).toHaveURL(/\/fr\/products\//)
  await expect(page.locator("h1")).toBeVisible()

  // 4) Add to cart — the button label varies between "Sélectionner un
  // format" (multi-variant, no format chosen) and "Ajouter au panier"
  // (single variant or format picked). We click whichever is enabled,
  // and fall back to clicking the first variant chip if needed.
  const variantChips = page.locator("[data-testid='product-options'] button")
  if ((await variantChips.count()) > 0) {
    await variantChips.first().click()
  }
  await page
    .locator("[data-testid='add-product-button']")
    .click({ trial: false })

  // 5) Navigate to the cart
  await page.goto("/fr/cart")
  await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible(
    {
      timeout: 10_000,
    }
  )

  // 6) The checkout button should be enabled
  await expect(
    page.getByRole("link", { name: /Go to checkout/i }).first()
  ).toBeVisible()
})
