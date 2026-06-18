/**
 * Single source of truth for Maison Lehena's legal identity on the storefront
 * (footer, legal mentions surfaced client-side).
 *
 * ⚠️ The registration fields below are EMPTY on purpose: they must be filled
 * with the company's REAL values before going live. Showing invented numbers on
 * a legal page is worse than showing "à venir". Keep these values in sync with
 * the backend CMS legal pages (apps/backend/src/scripts/seed-pages.ts → COMPANY).
 */
export const COMPANY = {
  /** Raison sociale, e.g. "Maison Lehena". */
  legalName: "Maison Lehena",
  /** Forme + capital, e.g. "SAS au capital de 50 000 €". TODO réel. */
  legalForm: "",
  /** SIRET (14 chiffres). TODO réel. */
  siret: "",
  /** TVA intracommunautaire (FR + 11 chiffres). TODO réel. */
  vatNumber: "",
  /** RCS, e.g. "RCS Bayonne 000 000 000". TODO réel. */
  rcs: "",
  address: {
    street: "Bourg",
    postalCode: "64470",
    city: "Laguinge",
    region: "Pyrénées-Atlantiques",
    country: "France",
  },
  email: "contact@lehena.fr",
  privacyEmail: "rgpd@lehena.fr",
  /** Téléphone public. TODO réel. */
  phone: "",
} as const

/** Footer line: real SIRET/TVA once filled, otherwise the "à venir" fallback. */
export function siretTvaFooterLine(): string {
  const siret = COMPANY.siret ? `SIRET ${COMPANY.siret}` : "SIRET à venir"
  const tva = COMPANY.vatNumber ? `TVA ${COMPANY.vatNumber}` : "TVA FR à venir"
  return `${siret} · ${tva}`
}
