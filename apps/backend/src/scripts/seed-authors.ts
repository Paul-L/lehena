import { type ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AUTHOR_MODULE } from "../modules/author"

interface SocialLink {
  platform: string
  url: string
}

interface AuthorSeed {
  slug: string
  name: string
  role_title: string | null
  bio: string | null
  photo_url: string | null
  credentials: string[] | null
  social_links: SocialLink[] | null
  email: string | null
  locale: string
}

/**
 * Minimal shape of the auto-generated Author module service methods we use.
 * MedusaService generates the full CRUD; we only need list + create + update
 * for an idempotent upsert-by-slug.
 */
interface AuthorRow {
  id: string
  slug: string
}
interface AuthorServiceLike {
  listAuthors(filters?: Record<string, unknown>): Promise<AuthorRow[]>
  createAuthors(data: Omit<AuthorSeed, never>[]): Promise<AuthorRow[]>
  updateAuthors(
    data: (Partial<AuthorSeed> & { id: string })[]
  ): Promise<AuthorRow[]>
}

/**
 * Editorial authors seeded for EEAT bylines (cf. SEO 07).
 *
 * ⚠️ PLACEHOLDERS — TO VALIDATE WITH PAUL:
 *   - `bio`: neutral placeholder, no invented dates/diplomas. Paul must
 *     replace it with a real 100+ word bio (see faq/EEAT requirements).
 *   - `photo_url`: left `null` on purpose. A candidate portrait already ships
 *     in the storefront at `/images/home-artisan-portrait.webp` (used on the
 *     /la-ferme page). Once Paul confirms it, set:
 *       photo_url: "https://lehena.fr/images/home-artisan-portrait.webp"
 *     (min 500×500, square or 4:5).
 *   - `credentials`: award list mirrors the /la-ferme timeline — confirm.
 */
const AUTHORS: AuthorSeed[] = [
  {
    slug: "benat-petit",
    name: "Bénat Petit",
    role_title: "Maître Artisan Charcutier",
    // TODO(Paul): bio placeholder À VALIDER — ne pas publier tel quel.
    // Remplacer par une biographie réelle de 100+ mots détaillant le
    // parcours, la formation et l'expertise (salaison, affinage long).
    bio:
      "[À VALIDER PAR PAUL] Bénat Petit est le maître artisan charcutier de la " +
      "Maison Lehena, au Pays Basque. Il élève ses porcs Duroc en plein air et " +
      "façonne une charcuterie fermière sans nitrite ni additif, en s'appuyant " +
      "sur les techniques de salaison et d'affinage long de la Soule. " +
      "Biographie détaillée à compléter (parcours, formation, expertise).",
    // Laissé null volontairement — placeholder photo à valider (cf. en-tête).
    photo_url: null,
    // TODO(Paul): confirmer les distinctions (reprises de la timeline /la-ferme).
    credentials: [
      "Maître Artisan Charcutier",
      "Médaillé — Concours Général Agricole de Paris (2016–2018)",
      "Prix d'Excellence — Concours Général Agricole (2020)",
    ],
    social_links: [
      { platform: "instagram", url: "https://www.instagram.com/maisonlehena/" },
    ],
    email: null,
    locale: "fr",
  },
]

export default async function seedAuthors({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const authorService = container.resolve(AUTHOR_MODULE) as AuthorServiceLike

  logger.info(`[seed-authors] Seeding ${AUTHORS.length} author(s)…`)

  let created = 0
  let updated = 0

  for (const seed of AUTHORS) {
    const existing = await authorService.listAuthors({ slug: seed.slug })

    if (existing.length > 0) {
      await authorService.updateAuthors([{ ...seed, id: existing[0].id }])
      updated++
      logger.info(`[seed-authors]   updated "${seed.slug}"`)
      continue
    }

    await authorService.createAuthors([seed])
    created++
    logger.info(`[seed-authors]   created "${seed.slug}"`)
  }

  logger.info(`[seed-authors] Done — created=${created} updated=${updated}`)
}
