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
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Préférences</h1>
        <p className="text-sm text-ui-fg-subtle max-w-2xl">
          Choisissez ce que vous voulez recevoir de notre part. Les emails
          transactionnels (commandes, expéditions) ne peuvent pas être
          désactivés.
        </p>
      </div>
      <NewsletterPreferences customer={customer} />
    </div>
  )
}
