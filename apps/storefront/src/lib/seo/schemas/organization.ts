import { getBaseURL } from "@lib/util/env"

import { SITE_NAME } from "../metadata"

/** Schema.org Organization for the Lehena legal entity. Injected on every page. */
export function organizationSchema() {
  const baseUrl = getBaseURL().replace(/\/$/, "")
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    alternateName: "LEHENA",
    legalName: "LEHENA SAS",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/assets/logo-lehena.png`,
    },
    foundingDate: "2019",
    founder: { "@type": "Person", name: "Bénat Petit" },
    // NAP aligné sur apps/backend/src/lib/company.ts (source de vérité légale).
    address: {
      "@type": "PostalAddress",
      streetAddress: "Le Bourg",
      addressLocality: "Laguinge-Restoue",
      postalCode: "64470",
      addressRegion: "Pyrénées-Atlantiques",
      addressCountry: "FR",
    },
    vatID: "FR29849613435",
    areaServed: { "@type": "Country", name: "France" },
    knowsAbout: [
      "Charcuterie artisanale",
      "Jambon sans nitrite",
      "Race Duroc",
      "Affinage long",
      "Pays Basque",
      "Salaisons",
      "Patxaran",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "contact@lehena.fr",
        availableLanguage: ["French", "Spanish", "English"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/maisonlehena",
      "https://www.instagram.com/maisonlehena",
    ],
    description:
      "Maître artisan charcutier au Pays Basque. Jambons affinés sans nitrite, salaisons, patxaran et épicerie fine du Sud-Ouest.",
  }
}
