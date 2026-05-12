import { JsonLd } from "@lib/seo/json-ld"
import { organizationSchema } from "@lib/seo/schemas/organization"
import { websiteSchema } from "@lib/seo/schemas/website"
import { getBaseURL } from "@lib/util/env"
import { type Metadata } from "next"
import Script from "next/script"
import "styles/globals.css"

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Maison Lehena · Maître artisan charcutier au Pays Basque",
  description:
    "Maître Artisan Charcutier au Pays Basque depuis 1974. Jambons affinés 24 mois, salaisons sans nitrite, patxaran, épicerie fine du Sud-Ouest.",
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
      </body>
    </html>
  )
}
