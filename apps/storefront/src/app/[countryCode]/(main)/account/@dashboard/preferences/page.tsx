import { retrieveCustomer } from "@lib/data/customer"
import NewsletterPreferences from "@modules/account/components/newsletter-preferences"
import { notFound } from "next/navigation"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Préférences — Espace client",
  robots: { index: false, follow: false },
}

export default async function PreferencesPage() {
  const customer = await retrieveCustomer()
  if (!customer) notFound()
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          className="serif-display"
          style={{
            fontSize: 32,
            lineHeight: 1,
            margin: "0 0 8px",
            letterSpacing: "-0.015em",
          }}
        >
          Préférences
        </h2>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: 15,
            color: "var(--ink-soft)",
            margin: 0,
          }}
        >
          Choisissez ce que vous voulez recevoir — et ce que vous préférez
          ignorer. Les emails transactionnels (commandes, expéditions) ne
          peuvent pas être désactivés.
        </p>
      </div>
      <NewsletterPreferences customer={customer} />
    </div>
  )
}
