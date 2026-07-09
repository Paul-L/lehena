/**
 * Single source of truth for Maison Lehena's legal identity côté backend
 * (emails transactionnels, factures PDF, mentions légales rendues serveur).
 *
 * ⚠️ Cette source doit rester alignée avec `apps/storefront/src/lib/company.ts`
 * qui pilote le rendu côté client. Toute modification ici → refléter là-bas.
 * À terme : sortir dans un package workspace (`packages/company`).
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

/** Ligne d'adresse compacte pour footer email. */
export function addressLine(): string {
  const a = COMPANY.address
  return `${COMPANY.legalName} · ${a.street} · ${a.postalCode} ${a.city} · ${a.country}`
}

/** Ligne SIRET/RCS + TVA pour footer / mentions légales. */
export function siretTvaFooterLine(): string {
  const id = COMPANY.siret
    ? `SIRET ${COMPANY.siret}`
    : COMPANY.rcs || "SIRET à venir"
  const tva = COMPANY.vatNumber ? `TVA ${COMPANY.vatNumber}` : "TVA FR à venir"
  return `${id} · ${tva}`
}
