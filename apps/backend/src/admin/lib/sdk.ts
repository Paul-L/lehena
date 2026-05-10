import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})

export const STOREFRONT_URL: string =
  import.meta.env.VITE_STOREFRONT_URL || "http://localhost:8000"

/**
 * Builds the storefront URL for a page, with an optional preview token
 * appended as the `?preview=…` query param. The storefront route then
 * forwards that token to the Medusa store API.
 */
export function buildPageStorefrontUrl(
  locale: string,
  slug: string,
  previewToken?: string
): string {
  const base = STOREFRONT_URL.replace(/\/$/, "")
  const url = `${base}/${locale}/${slug}`
  return previewToken
    ? `${url}?preview=${encodeURIComponent(previewToken)}`
    : url
}
