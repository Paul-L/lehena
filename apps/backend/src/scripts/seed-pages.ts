import { type ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  createPageWorkflow,
  publishPageWorkflow,
  type CreatePageInput,
} from "../workflows/pages"

type SeedPage = CreatePageInput & {
  publish: boolean
}

const txt = (text: string) => ({ type: "text", text })
const para = (...content: ReturnType<typeof txt>[]) => ({
  type: "paragraph",
  content,
})
const h2 = (text: string) => ({
  type: "heading",
  attrs: { level: 2 },
  content: [txt(text)],
})
const h3 = (text: string) => ({
  type: "heading",
  attrs: { level: 3 },
  content: [txt(text)],
})
const ul = (items: string[]) => ({
  type: "bulletList",
  content: items.map((it) => ({
    type: "listItem",
    content: [para(txt(it))],
  })),
})
const ol = (items: string[]) => ({
  type: "orderedList",
  content: items.map((it) => ({
    type: "listItem",
    content: [para(txt(it))],
  })),
})
const link = (url: string, label: string) => ({
  type: "text",
  text: label,
  marks: [
    {
      type: "link",
      attrs: { href: url, target: "_blank", rel: "noopener noreferrer" },
    },
  ],
})

const doc = (...content: unknown[]) => ({ type: "doc", content })

const SEEDS = (locale: string): SeedPage[] => [
  {
    slug: "a-propos",
    title: "À propos",
    locale,
    excerpt: "Découvrez l'histoire et les valeurs de notre boutique.",
    meta_title: "À propos — Lehena",
    meta_description:
      "Maison Lehena est une charcuterie artisanale du Pays Basque. Découvrez notre histoire, nos valeurs et l'équipe derrière les produits.",
    content: doc(
      h2("Notre histoire"),
      para(
        txt(
          "Maison Lehena perpétue depuis 1974 un savoir-faire transmis de génération en génération. Tout commence dans un petit village du Pays Basque, où notre fondateur décide de remettre au goût du jour les techniques de salaison ancestrales."
        )
      ),
      h2("Notre mission"),
      para(
        txt(
          "Proposer des produits sans nitrite, affinés long, élaborés à partir de cochons élevés en plein air dans notre région. La qualité n'est pas négociable : chaque pièce est contrôlée individuellement avant d'être expédiée."
        )
      ),
      h3("Nos engagements"),
      ul([
        "Aucun nitrite ajouté dans nos salaisons",
        "Affinage minimum de 12 mois pour les jambons",
        "Approvisionnement local exclusivement (rayon < 100 km)",
        "Emballage 100 % recyclable depuis 2023",
      ]),
      h2("L'équipe"),
      para(
        txt(
          "Sept artisans charcutiers travaillent quotidiennement à l'atelier. Pour toute question, contactez-nous à "
        ),
        link("mailto:contact@lehena.com", "contact@lehena.com"),
        txt(".")
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "faq",
    title: "Questions fréquentes",
    locale,
    excerpt:
      "Réponses aux questions fréquentes sur nos produits et la livraison.",
    meta_title: "FAQ — Lehena",
    meta_description:
      "Toutes les réponses aux questions fréquentes : conservation, livraison, retours, paiement.",
    content: doc(
      h3("Combien de temps puis-je conserver un jambon entier ?"),
      para(
        txt(
          "Une fois entamé, un jambon affiné se conserve jusqu'à 3 mois s'il est protégé d'un linge propre et stocké entre 14 et 16 °C, à l'abri de la lumière directe."
        )
      ),
      h3("Livrez-vous à l'étranger ?"),
      para(
        txt(
          "Nous livrons en France métropolitaine, en Belgique, au Luxembourg et en Espagne. Pour le reste de l'Europe, contactez-nous pour un devis."
        )
      ),
      h3("Vos produits contiennent-ils du gluten ?"),
      para(
        txt(
          "Non, l'ensemble de notre gamme charcuterie est naturellement sans gluten. La gamme épicerie est étiquetée au cas par cas."
        )
      ),
      h3("Comment se passe le retour d'un produit ?"),
      para(
        txt(
          "Pour des raisons d'hygiène, les produits alimentaires non scellés ne sont pas repris. Pour les produits scellés ou défectueux, voir notre page "
        ),
        link("/livraison-et-retours", "Livraison et retours"),
        txt(".")
      ),
      h3("Quels modes de paiement acceptez-vous ?"),
      para(
        txt(
          "Carte bancaire (Visa, Mastercard, AmEx), Apple Pay, Google Pay, et virement bancaire pour les commandes professionnelles supérieures à 500 €."
        )
      ),
      h3("Puis-je offrir un produit avec un message personnalisé ?"),
      para(
        txt(
          "Oui, ajoutez votre message lors du checkout dans le champ « Note de commande ». Nous l'imprimons sur une carte glissée dans le colis."
        )
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "livraison-et-retours",
    title: "Livraison et retours",
    locale,
    excerpt:
      "Tout savoir sur nos modes de livraison, délais et politique de retour.",
    meta_title: "Livraison et retours — Lehena",
    meta_description:
      "Modes de livraison, zones desservies, délais de traitement et procédure de retour.",
    content: doc(
      h2("Zones de livraison"),
      ul([
        "France métropolitaine (hors Corse) — 24 à 48 h",
        "Corse — 3 à 5 jours ouvrés",
        "Belgique, Luxembourg, Pays-Bas — 3 jours ouvrés",
        "Espagne, Portugal — 4 jours ouvrés",
      ]),
      h2("Délais de traitement"),
      para(
        txt(
          "Les commandes passées avant 12 h sont préparées le jour même et expédiées sous 24 h. Au-delà, expédition le lendemain ouvré."
        )
      ),
      h2("Procédure de retour"),
      ol([
        "Contactez-nous à contact@lehena.com en précisant votre numéro de commande",
        "Nous vous envoyons une étiquette de retour prépayée par email",
        "Réexpédiez le colis sous 14 jours",
        "Remboursement effectué sous 5 jours ouvrés après réception",
      ]),
      h2("Contact"),
      para(
        txt("Une question ? Écrivez-nous à "),
        link("mailto:contact@lehena.com", "contact@lehena.com"),
        txt(" ou appelez le 05 59 00 00 00 (du lundi au vendredi, 9 h – 18 h).")
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    locale,
    excerpt: "Mentions légales obligatoires du site Lehena.",
    meta_title: "Mentions légales — Lehena",
    meta_description:
      "Éditeur, hébergeur, propriété intellectuelle et données personnelles.",
    content: doc(
      h2("Éditeur du site"),
      para(
        txt(
          "Maison Lehena SAS — capital social 50 000 € — RCS Bayonne 123 456 789 — TVA intracommunautaire FR12345678901. Siège social : 1 rue du Marché, 64200 Biarritz."
        )
      ),
      h2("Hébergement"),
      para(
        txt(
          "Le site est hébergé par OVH SAS, 2 rue Kellermann, 59100 Roubaix, France."
        )
      ),
      h2("Propriété intellectuelle"),
      para(
        txt(
          "L'ensemble des contenus présents sur ce site (textes, images, logos, graphismes) sont la propriété exclusive de Maison Lehena SAS et sont protégés par le Code de la propriété intellectuelle."
        )
      ),
      h2("Données personnelles"),
      para(
        txt(
          "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à "
        ),
        link("mailto:rgpd@lehena.com", "rgpd@lehena.com"),
        txt(".")
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "notre-prochaine-collection",
    title: "Notre prochaine collection",
    locale,
    excerpt: "Un avant-goût des nouveautés à venir cet automne.",
    content: doc(
      para(
        txt(
          "Cet automne, nous lançons une gamme de saucissons aux herbes sauvages cueillies dans le massif d'Iraty. Restez à l'écoute."
        )
      )
    ) as Record<string, unknown>,
    publish: false,
  },
]

export default async function seedPages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const locale = process.env.SEED_LOCALE ?? "fr"
  const force = process.env.SEED_FORCE === "true"

  logger.info(`[seed-pages] Seeding pages (locale=${locale}, force=${force})`)

  // Lazy-import the module service to access the underlying CRUD methods
  // for collision checks and force-delete; mutations still go through the
  // workflows below so events fire normally.
  const pagesService = container.resolve("pages") as {
    listPages(
      filters?: Record<string, unknown>
    ): Promise<{ id: string; slug: string }[]>
    deletePages(ids: string | string[]): Promise<void>
  }

  let created = 0
  let skipped = 0
  let removed = 0

  for (const seed of SEEDS(locale)) {
    const existing = await pagesService.listPages({ slug: seed.slug })

    if (existing.length > 0) {
      if (!force) {
        logger.info(
          `[seed-pages]   skip "${seed.slug}" (already exists, use SEED_FORCE=true to overwrite)`
        )
        skipped++
        continue
      }
      await pagesService.deletePages(existing.map((p) => p.id))
      removed += existing.length
    }

    const { result } = await createPageWorkflow(container).run({
      input: {
        slug: seed.slug,
        title: seed.title,
        content: seed.content,
        excerpt: seed.excerpt ?? null,
        meta_title: seed.meta_title ?? null,
        meta_description: seed.meta_description ?? null,
        og_image_url: seed.og_image_url ?? null,
        locale: seed.locale,
      },
    })

    if (seed.publish) {
      await publishPageWorkflow(container).run({
        input: { id: result.id },
      })
    }

    created++
    logger.info(
      `[seed-pages]   created "${seed.slug}" (${seed.publish ? "published" : "draft"})`
    )
  }

  logger.info(
    `[seed-pages] Done — created=${created} skipped=${skipped} removed=${removed}`
  )
}
