import { getBaseURL } from "@lib/util/env"
import { type Metadata } from "next"
import "styles/globals.css"

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
      </head>
      <body className="lh">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
