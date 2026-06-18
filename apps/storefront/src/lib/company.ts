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
  /** Raison sociale. */
  legalName: "LEHENA",
  /** Forme + capital. */
  legalForm: "Société par actions simplifiée (SAS) au capital de 1 000 €",
  /** SIRET (14 chiffres = SIREN + NIC établissement). TODO: NIC manquant. */
  siret: "",
  /** TVA intracommunautaire — dérivée du SIREN (clé 29). À confirmer compta. */
  vatNumber: "FR29849613435",
  /** RCS + numéro (= SIREN). */
  rcs: "RCS Pau 849 613 435",
  address: {
    street: "Le Bourg",
    postalCode: "64470",
    city: "Laguinge-Restoue",
    region: "Pyrénées-Atlantiques",
    country: "France",
  },
  email: "contact@lehena.fr",
  privacyEmail: "rgpd@lehena.fr",
  /** Téléphone public. TODO réel. */
  phone: "",
} as const

/** Footer legal line: SIRET if known, else RCS; plus the VAT number. */
export function siretTvaFooterLine(): string {
  const id = COMPANY.siret
    ? `SIRET ${COMPANY.siret}`
    : COMPANY.rcs || "SIRET à venir"
  const tva = COMPANY.vatNumber ? `TVA ${COMPANY.vatNumber}` : "TVA FR à venir"
  return `${id} · ${tva}`
}
