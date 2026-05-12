import type React from "react"

/**
 * Renders a React Email component to HTML + plain-text fallback.
 *
 * `@react-email/render` is ESM-only — dynamic-import it the same way the
 * invoice PDF template does so CommonJS compilation doesn't break.
 */
export async function renderEmail(
  component: React.ReactElement
): Promise<{ html: string; text: string }> {
  const { render } = await import("@react-email/render")
  const [html, text] = await Promise.all([
    render(component, { pretty: false }),
    render(component, { plainText: true }),
  ])
  return { html, text }
}
