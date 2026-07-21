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
    legalName: "Maison Lehena",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/assets/logo-lehena.png`,
    },
    foundingDate: "2019",
    founder: { "@type": "Person", name: "Bénat Petit" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bourg",
      addressLocality: "Laguinge",
      postalCode: "64470",
      addressRegion: "Pyrénées-Atlantiques",
      addressCountry: "FR",
    },
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
