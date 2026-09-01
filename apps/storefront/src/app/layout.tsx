import { JsonLd } from "@lib/seo/json-ld"
import { organizationSchema } from "@lib/seo/schemas/organization"
import { websiteSchema } from "@lib/seo/schemas/website"
import { getBaseURL } from "@lib/util/env"
import WebVitalsReporter from "@modules/common/components/web-vitals-reporter"
import { type Metadata, type Viewport } from "next"
import Script from "next/script"
import "styles/globals.css"

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Maison Lehena · Maître artisan charcutier au Pays Basque",
  description:
    "Maître Artisan Charcutier au Pays Basque. Jambons affinés 15 mois minimum, salaisons sans nitrite, patxaran, épicerie fine du Sud-Ouest.",
}

export const viewport: Viewport = {
  themeColor: "#a83925",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-mode="light" className="lehena">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Speed up the first backend/static-image fetch (images produits). */}
        {BACKEND_URL ? (
          <link rel="preconnect" href={BACKEND_URL} crossOrigin="anonymous" />
        ) : null}
        {PLAUSIBLE_DOMAIN ? (
          <link rel="dns-prefetch" href="https://plausible.io" />
        ) : null}
        {/* Discovery des données structurées et fichiers de crawl IA (GEO). */}
        <link
          rel="alternate"
          type="application/xml"
          title="Google Merchant Feed"
          href="/feed/google-merchant.xml"
        />
        <link rel="ai" type="text/plain" href="/ai.txt" />
        <link rel="llm" type="text/markdown" href="/llms.txt" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <JsonLd id="lehena-organization" schema={organizationSchema()} />
        <JsonLd id="lehena-website" schema={websiteSchema()} />
        {PLAUSIBLE_DOMAIN ? (
          <>
            <Script
              defer
              data-domain={PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.manual.revenue.tagged-events.js"
              strategy="afterInteractive"
            />
            {/*
              The `manual` variant lets us fire pageviews ourselves so we can
              skip the storefront's admin/preview pages, plus carry custom
              props. `revenue` enables monetary tracking on the purchase
              event; `tagged-events` enables click-tagging via data attrs.
            */}
            <Script id="plausible-bootstrap" strategy="afterInteractive">
              {`window.plausible = window.plausible || function(){(window.plausible.q = window.plausible.q || []).push(arguments)};window.plausible('pageview');`}
            </Script>
          </>
        ) : null}
      </head>
      <body className="lh">
        <main className="relative">{props.children}</main>
        <WebVitalsReporter />
      </body>
    </html>
  )
}
