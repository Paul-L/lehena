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

const pressQuote = (
  quote: string,
  author: string,
  outlet: string,
  outlet_logo_url: string | null = null
) => ({
  type: "press-quote",
  attrs: { quote, author, outlet, outlet_logo_url },
})

const gallery = (items: { src: string; alt: string; caption?: string }[]) => ({
  type: "gallery-terroir",
  attrs: { items },
})

const callout = (
  tone: "info" | "note" | "warning",
  title: string,
  ...content: unknown[]
) => ({
  type: "callout",
  attrs: { tone, title },
  content: content.length > 0 ? content : [{ type: "paragraph" }],
})

/**
 * Legal identity for the mandatory pages below. Mirror of the storefront's
 * `apps/storefront/src/lib/company.ts`. The empty fields are REAL values the
 * company must provide before launch — we render an obvious "[à compléter]"
 * marker rather than inventing RCS / SIRET / TVA numbers.
 */
const COMPANY = {
  legalName: "LEHENA",
  legalForm: "Société par actions simplifiée (SAS) au capital de 1 000 €",
  siret: "", // 14 chiffres = SIREN + NIC établissement — NIC manquant
  vatNumber: "FR29849613435", // dérivée du SIREN (clé 29) — à confirmer compta
  rcs: "RCS Pau 849 613 435",
  address: "Le Bourg, 64470 Laguinge-Restoue (Pyrénées-Atlantiques), France",
  email: "contact@lehena.fr",
  privacyEmail: "rgpd@lehena.fr",
  phone: "", // ex. "05 59 00 00 00"
  publicationDirector: "M. Bernard Petit, Président",
  host: "OVH SAS — 2 rue Kellermann, 59100 Roubaix, France",
}
const todo = (value: string, hint: string) =>
  value && value.length > 0 ? value : `[à compléter — ${hint}]`

const SEEDS = (locale: string): SeedPage[] => [
  {
    slug: "a-propos",
    title: "À propos",
    locale,
    excerpt: "Découvrez l'histoire et les valeurs de notre boutique.",
    meta_title: "À propos — Lehena",
    meta_description:
      "Maison Lehena est une charcuterie artisanale du Pays Basque. Découvrez notre histoire, nos valeurs et l'équipe derrière les produits.",
    og_image_url: "https://lehena.fr/wp-content/uploads/2022/02/MRL05870.jpg",
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
        link("mailto:contact@lehena.fr", "contact@lehena.fr"),
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
    og_image_url:
      "https://lehena.fr/wp-content/uploads/2020/04/Patxaran-basque-artisanal.jpg",
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
        "Contactez-nous à contact@lehena.fr en précisant votre numéro de commande",
        "Nous vous envoyons une étiquette de retour prépayée par email",
        "Réexpédiez le colis sous 14 jours",
        "Remboursement effectué sous 5 jours ouvrés après réception",
      ]),
      h2("Contact"),
      para(
        txt("Une question ? Écrivez-nous à "),
        link("mailto:contact@lehena.fr", "contact@lehena.fr"),
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
          `${COMPANY.legalName} — ${todo(COMPANY.legalForm, "forme juridique + capital")}. Siège social : ${COMPANY.address}. ${todo(COMPANY.rcs, "RCS")} · ${todo(COMPANY.siret ? `SIRET ${COMPANY.siret}` : "", "SIRET")} · ${todo(COMPANY.vatNumber ? `TVA intracommunautaire ${COMPANY.vatNumber}` : "", "TVA intracommunautaire")}.`
        )
      ),
      para(
        txt("Directeur de la publication : "),
        txt(
          todo(
            COMPANY.publicationDirector,
            "nom du directeur de la publication"
          )
        ),
        txt(". Contact : "),
        link(`mailto:${COMPANY.email}`, COMPANY.email),
        txt(COMPANY.phone ? ` — ${COMPANY.phone}.` : ".")
      ),
      h2("Hébergement"),
      para(txt(`Le site est hébergé par ${COMPANY.host}.`)),
      h2("Propriété intellectuelle"),
      para(
        txt(
          `L'ensemble des contenus présents sur ce site (textes, photographies, logos, graphismes) sont la propriété exclusive de ${COMPANY.legalName} et sont protégés par le Code de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.`
        )
      ),
      h2("Données personnelles & cookies"),
      para(
        txt("Le traitement de vos données est détaillé dans notre "),
        link("/fr/politique-confidentialite", "politique de confidentialité"),
        txt(". Pour exercer vos droits RGPD, écrivez à "),
        link(`mailto:${COMPANY.privacyEmail}`, COMPANY.privacyEmail),
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
  {
    slug: "notre-histoire",
    title: "Notre histoire",
    locale,
    excerpt:
      "Quatre générations d'artisans charcutiers au Pays Basque, et une certitude : prendre le temps.",
    meta_title: "Notre histoire — Lehena",
    meta_description:
      "Depuis 1974, Maison Lehena perpétue les techniques de salaison ancestrales du Pays Basque. Quatre générations, une même obsession : la qualité.",
    og_image_url: "https://lehena.fr/wp-content/uploads/2022/02/MRL05787.jpg",
    content: doc(
      h2("Au commencement, une obstination"),
      para(
        txt(
          "Quand Jean-Baptiste Lehena ouvre son atelier en 1974, dans la vallée des Aldudes, on lui dit qu'il est dépassé. Les jambons mettent trop de temps à sécher ; les chambres froides industrielles vont plus vite, à moindre coût. Il n'écoute pas."
        )
      ),
      pressQuote(
        "Chez Lehena, on n'invente rien. On laisse simplement le temps faire son travail.",
        "Marc Demaison",
        "Le Monde · Le Goût"
      ),
      h2("Trois ateliers, une seule règle"),
      para(
        txt(
          "Aujourd'hui, l'atelier d'origine est toujours là — agrandi, mais inchangé dans ses gestes. Les jambons y restent au minimum douze mois, parfois trente. Les saucissons sèchent en cave naturelle, ventilée par les vents d'ouest. Aucun nitrite. Aucun raccourci."
        )
      ),
      gallery([
        {
          src: "/placeholder-ferme-1.jpg",
          alt: "Cave d'affinage",
          caption: "Cave d'affinage, 14 °C constant",
        },
        {
          src: "/placeholder-ferme-2.jpg",
          alt: "Pièce en suspension",
          caption: "Pièce en suspension, 18e mois",
        },
        {
          src: "/placeholder-ferme-3.jpg",
          alt: "Salle de désossage",
          caption: "Salle de désossage, lundi matin",
        },
      ]),
      h2("La transmission, comme priorité"),
      para(
        txt(
          "Quatre générations plus tard, Maïté Lehena dirige l'atelier avec son père, Pantxo. Sept artisans — dont trois apprentis — y travaillent à plein temps. Les techniques sont enseignées en face à face, jamais par écrit : c'est la main qui sait."
        )
      ),
      callout(
        "note",
        "Le saviez-vous ?",
        para(
          txt(
            "Un jambon Lehena perd entre 38 % et 45 % de son poids à l'affinage. C'est ce qui concentre ses arômes — et explique son prix."
          )
        )
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "la-ferme",
    title: "De la ferme à l'assiette",
    locale,
    excerpt:
      "Une seule race, six éleveurs partenaires, et un cahier des charges plus strict que toute appellation.",
    meta_title: "De la ferme à l'assiette — Lehena",
    meta_description:
      "Tous nos cochons proviennent de six élevages partenaires dans un rayon de 80 km. Race basque, plein air, alimentation locale.",
    og_image_url:
      "https://lehena.fr/wp-content/uploads/2022/02/iStock-1205500981-1.jpg",
    content: doc(
      h2("La race basque, et rien d'autre"),
      para(
        txt(
          "Le porc basque — kintoa — est une race rustique qui a failli disparaître dans les années 1980. Quelques éleveurs l'ont sauvée. Aujourd'hui, c'est la seule race que nous travaillons : croissance lente, chair persillée, goût singulier."
        )
      ),
      gallery([
        {
          src: "/placeholder-eleveur-1.jpg",
          alt: "Éleveur dans son pré",
          caption: "Joseph, élevage de la Soule",
        },
        {
          src: "/placeholder-eleveur-2.jpg",
          alt: "Porcs basques au pâturage",
          caption: "Pâturage d'altitude, juin",
        },
      ]),
      h2("Six élevages, 80 kilomètres maximum"),
      para(
        txt(
          "Nous travaillons exclusivement avec six éleveurs, tous situés dans un rayon de 80 km autour de l'atelier. Chaque ferme est visitée plusieurs fois par an. Les bêtes vivent en plein air, nourries avec des céréales locales et des glands en saison."
        )
      ),
      callout(
        "info",
        "Notre cahier des charges",
        para(
          txt(
            "Plein air permanent · alimentation 100 % d'origine locale · abattage à 14 mois minimum · transport limité à 1 h."
          )
        )
      ),
      h2("Ce que nous refusons"),
      ul([
        "Aucun additif nitrité (ni E249, ni E250, ni E251, ni E252)",
        "Aucune accélération de l'affinage par chaleur ou ventilation forcée",
        "Aucun fournisseur situé à plus de 80 km de l'atelier",
        "Aucune commande passée sans visite préalable de la ferme",
      ])
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "engagements",
    title: "Nos engagements",
    locale,
    excerpt:
      "Six promesses tenues, vérifiables, et opposables. Le reste, ce sont des mots.",
    meta_title: "Engagements — Maison Lehena",
    meta_description:
      "Six engagements concrets et vérifiables : sans nitrite, traçabilité totale, fournisseurs locaux, emballage recyclable.",
    og_image_url: "https://lehena.fr/wp-content/uploads/2022/02/MRL05798.jpg",
    content: doc(
      para(
        txt(
          "Nous ne croyons pas aux engagements vagues. Voici les six règles qui orientent chaque décision, depuis l'achat de la matière première jusqu'à la livraison."
        )
      ),
      h2("1. Sans nitrite — pour de vrai"),
      callout(
        "warning",
        "Aucune exception",
        para(
          txt(
            "Cela vaut pour TOUTE notre gamme, y compris les recettes traditionnelles. Aucun produit Lehena ne contient de nitrite ajouté."
          )
        )
      ),
      h2("2. Affinage long, parce que ça change tout"),
      para(
        txt(
          "Nos jambons sont affinés au minimum 12 mois. Nos saucissons, au minimum 6 semaines. Le temps n'est pas négociable."
        )
      ),
      h2("3. Traçabilité totale"),
      para(
        txt(
          "Chaque pièce porte un code unique permettant de remonter à la ferme, à la date d'abattage, à la chambre d'affinage. Disponible sur demande."
        )
      ),
      h2("4. Fournisseurs locaux exclusivement"),
      para(
        txt(
          "80 km maximum. Aucun fournisseur n'est plus éloigné. Notre liste complète est publiée chaque année."
        )
      ),
      h2("5. Emballage 100 % recyclable"),
      para(
        txt(
          "Depuis 2023, tous nos emballages — y compris les pochettes sous vide — sont compatibles avec les filières de recyclage françaises."
        )
      ),
      h2("6. Prix transparent"),
      para(
        txt(
          "Nos marges sont publiées chaque année dans le rapport annuel. Vous payez ce qui est juste, ni plus ni moins."
        )
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "presse",
    title: "Ils en parlent",
    locale,
    excerpt:
      "Une sélection de ce que la presse — française et étrangère — a écrit sur la maison.",
    meta_title: "Revue de presse — Lehena",
    meta_description:
      "Le Monde, Le Figaro, Le Pays Basque, San Sebastian Gastronomika… Une revue de presse choisie.",
    og_image_url: "https://lehena.fr/wp-content/uploads/2020/04/99.jpg",
    content: doc(
      para(
        txt(
          "Nous évitons les communiqués de presse. Quand un journaliste s'intéresse à nous, c'est qu'il a fait le voyage jusqu'à la vallée des Aldudes. Voici ce qu'ils en ont retiré."
        )
      ),
      pressQuote(
        "Le meilleur jambon non-espagnol que j'aie goûté depuis dix ans. Une obstination familiale qui force le respect.",
        "Marc Demaison",
        "Le Monde · Le Goût"
      ),
      pressQuote(
        "Maïté Lehena représente une nouvelle génération d'artisans qui refusent les compromis. Le résultat est dans l'assiette.",
        "Élise Ferrand",
        "Le Figaro Magazine"
      ),
      pressQuote(
        "On y va pour le jambon. On en repart en voulant déménager dans la vallée.",
        "Igor Etxeberria",
        "San Sebastián Gastronomika"
      ),
      pressQuote(
        "Une maison qui prouve que le sans-nitrite n'est pas un compromis, mais une exigence supérieure.",
        "Carla Marchetti",
        "Slow Food · Italia"
      ),
      h2("Contact presse"),
      para(
        txt("Pour toute demande de visite ou d'interview : "),
        link("mailto:presse@lehena.fr", "presse@lehena.fr")
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "atelier",
    title: "L'atelier — visites & boutique",
    locale,
    excerpt:
      "L'atelier Lehena est à Laguinge, dans la vallée des Aldudes. Boutique ouverte le samedi matin.",
    meta_title: "Atelier & boutique — Maison Lehena",
    meta_description:
      "Visitez notre atelier d'origine dans la vallée des Aldudes. Boutique ouverte le samedi de 9 h à 13 h. Visites guidées sur rendez-vous à partir de 2026.",
    og_image_url:
      "https://lehena.fr/wp-content/uploads/2022/02/iStock-1192465356-1.jpg",
    content: doc(
      h2("Nous rendre visite"),
      para(
        txt(
          "L'atelier Lehena est niché au cœur de la vallée des Aldudes, à Laguinge. La boutique est ouverte au public le samedi matin de 9 h à 13 h. Le reste de la semaine, l'atelier vit au rythme de l'affinage."
        )
      ),
      h3("Adresse"),
      para(
        txt(
          "Maison Lehena — Bourg, 64470 Laguinge, Pyrénées-Atlantiques, France."
        )
      ),
      h3("Horaires boutique"),
      ul(["Samedi : 9 h – 13 h", "Du lundi au vendredi : sur rendez-vous"]),
      h3("Visites guidées"),
      callout(
        "note",
        "À partir de 2026",
        para(
          txt(
            "Les visites guidées de l'atelier (cave d'affinage, salle de désossage, dégustation) reprennent en 2026. Atelier accord patxaran / charcuterie, atelier dégustation affinage long. Inscription par email à "
          ),
          link("mailto:visites@lehena.fr", "visites@lehena.fr"),
          txt(" — places limitées.")
        )
      ),
      h2("Comment venir"),
      para(
        txt(
          "Laguinge est à 45 minutes de Saint-Jean-Pied-de-Port et 1 h 15 de Bayonne. Parking gratuit devant l'atelier. La D 26 traverse le village — l'atelier est situé entre la mairie et l'église."
        )
      ),
      h2("Nous contacter"),
      para(
        txt("Email : "),
        link("mailto:contact@lehena.fr", "contact@lehena.fr"),
        txt(" — Téléphone : 05 59 00 00 00 (du lundi au vendredi, 9 h – 18 h).")
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "cgv",
    title: "Conditions générales de vente",
    locale,
    excerpt: "Conditions générales applicables aux ventes en ligne.",
    meta_title: "CGV — Lehena",
    meta_description:
      "Conditions générales de vente : commande, paiement, livraison, droit de rétractation.",
    content: doc(
      callout(
        "warning",
        "Projet — à faire valider",
        para(
          txt(
            "Rédaction de référence pour une boutique alimentaire artisanale. À faire relire et compléter par un conseil juridique (notamment le médiateur de la consommation) avant la mise en production."
          )
        )
      ),
      h2("Article 1 — Objet et champ d'application"),
      para(
        txt(
          "Les présentes conditions générales de vente (CGV) régissent l'ensemble des ventes conclues sur le site lehena.fr entre "
        ),
        txt(
          `${COMPANY.legalName} (ci-après « le Vendeur ») et toute personne effectuant un achat (ci-après « le Client »). Toute commande implique l'acceptation sans réserve des présentes CGV.`
        )
      ),
      h2("Article 2 — Identification du vendeur"),
      para(
        txt(
          `${COMPANY.legalName} — ${todo(COMPANY.legalForm, "forme + capital")}, siège social ${COMPANY.address}. ${todo(COMPANY.siret ? `SIRET ${COMPANY.siret}` : "", "SIRET")}. ${todo(COMPANY.vatNumber ? `TVA ${COMPANY.vatNumber}` : "", "TVA")}. Contact : `
        ),
        link(`mailto:${COMPANY.email}`, COMPANY.email),
        txt(COMPANY.phone ? ` — ${COMPANY.phone}.` : ".")
      ),
      h2("Article 3 — Produits"),
      para(
        txt(
          "Les produits proposés sont des denrées alimentaires artisanales (jambons, salaisons, plats cuisinés, épicerie) et des accessoires. Les photographies et descriptifs sont les plus fidèles possibles mais ne sauraient engager le Vendeur, s'agissant de produits artisanaux dont l'aspect et le poids peuvent légèrement varier. Les produits sont proposés dans la limite des stocks disponibles."
        )
      ),
      h2("Article 4 — Prix"),
      para(
        txt(
          "Les prix sont indiqués en euros, toutes taxes comprises (TVA 5,5 % sur les denrées alimentaires, 20 % sur les accessoires), hors frais de livraison précisés avant validation de la commande. Le Vendeur se réserve le droit de modifier ses prix à tout moment, les produits étant facturés au tarif en vigueur lors de la validation de la commande."
        )
      ),
      h2("Article 5 — Commande"),
      para(
        txt(
          "Le Client sélectionne ses produits, vérifie le détail de son panier, renseigne ses coordonnées puis valide sa commande après acceptation des présentes CGV. La vente est conclue à la confirmation de commande adressée par courriel. Le Vendeur se réserve le droit d'annuler toute commande en cas de litige antérieur ou de motif légitime."
        )
      ),
      h2("Article 6 — Paiement"),
      para(
        txt(
          "Le paiement s'effectue en ligne par carte bancaire au moment de la commande, via notre prestataire sécurisé Stripe. Aucune donnée de carte n'est conservée par le Vendeur. La commande n'est traitée qu'après confirmation du paiement."
        )
      ),
      h2("Article 7 — Livraison et retrait"),
      para(
        txt(
          "Les commandes sont livrées en France métropolitaine, au choix : livraison réfrigérée Chronofresh (produits frais, 24–48 h), livraison Colissimo (produits secs, 48–72 h), ou retrait gratuit à l'atelier de Laguinge. Tout panier contenant un produit frais est expédié en chaîne du froid. Les frais de port sont offerts dès 50 € d'achat. Les délais sont indicatifs ; le transfert des risques intervient à la remise du colis au Client."
        )
      ),
      h2("Article 8 — Droit de rétractation"),
      para(
        txt(
          "Conformément à l'article L.221-28 3° du Code de la consommation, le droit de rétractation ne s'applique pas aux denrées alimentaires périssables. Pour les produits non périssables (accessoires), le Client dispose d'un délai de 14 jours à compter de la réception pour se rétracter, en retournant le produit neuf et non utilisé, les frais de retour restant à sa charge ; le remboursement intervient sous 14 jours après réception du retour."
        )
      ),
      h2("Article 9 — Garanties légales"),
      para(
        txt(
          "Indépendamment de toute garantie commerciale, le Vendeur reste tenu de la garantie légale de conformité (articles L.217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil)."
        )
      ),
      h2("Article 10 — Réclamations et service client"),
      para(
        txt("Toute réclamation peut être adressée à "),
        link(`mailto:${COMPANY.email}`, COMPANY.email),
        txt(
          ". En cas de produit non conforme ou endommagé au transport, le signaler sous 48 h avec photographies à l'appui."
        )
      ),
      h2("Article 11 — Médiation de la consommation"),
      para(
        txt(
          "Conformément à l'article L.612-1 du Code de la consommation, le Client peut recourir gratuitement à un médiateur de la consommation : "
        ),
        txt(todo("", "nom et coordonnées du médiateur agréé"))
      ),
      h2("Article 12 — Données personnelles"),
      para(
        txt("Le traitement des données est décrit dans notre "),
        link("/fr/politique-confidentialite", "politique de confidentialité"),
        txt(".")
      ),
      h2("Article 13 — Droit applicable et litiges"),
      para(
        txt(
          "Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, tout litige relève des tribunaux français compétents."
        )
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "politique-confidentialite",
    title: "Politique de confidentialité",
    locale,
    excerpt:
      "Comment nous collectons, utilisons et protégeons vos données personnelles.",
    meta_title: "Politique de confidentialité — Lehena",
    meta_description:
      "Conforme RGPD : collecte, finalité, durée de conservation, droits, contact DPO.",
    content: doc(
      callout(
        "note",
        "Projet — à faire valider",
        para(
          txt(
            "Rédaction de référence conforme au RGPD. À faire relire et compléter (durées exactes, outils analytics réellement utilisés) avant la mise en production."
          )
        )
      ),
      h2("Responsable du traitement"),
      para(
        txt(
          `${COMPANY.legalName}, ${COMPANY.address}. Contact données personnelles : `
        ),
        link(`mailto:${COMPANY.privacyEmail}`, COMPANY.privacyEmail),
        txt(".")
      ),
      h2("Données collectées"),
      ul([
        "Identité et coordonnées (nom, prénom, adresse, téléphone, email)",
        "Données de paiement (traitées par notre prestataire Stripe — jamais stockées par nous)",
        "Historique et détail des commandes",
        "Données de navigation et cookies (voir la bannière de consentement)",
      ]),
      h2("Finalités et bases légales"),
      ul([
        "Exécution du contrat de vente et gestion des commandes (exécution du contrat)",
        "Relation et service client (intérêt légitime)",
        "Envoi de la newsletter (consentement explicite, révocable à tout moment)",
        "Mesure d'audience du site (consentement / intérêt légitime selon l'outil)",
        "Respect des obligations comptables et fiscales (obligation légale)",
      ]),
      h2("Destinataires & sous-traitants"),
      para(
        txt(
          "Vos données ne sont jamais vendues. Elles sont partagées uniquement avec nos sous-traitants techniques : hébergeur ("
        ),
        txt(`${COMPANY.host}`),
        txt(
          "), prestataire de paiement (Stripe), transporteurs (Chronofresh, Colissimo) pour la seule exécution de la commande."
        )
      ),
      h2("Durée de conservation"),
      para(
        txt(
          "Données client et commandes : durée de la relation contractuelle puis archivage légal (jusqu'à 10 ans pour les pièces comptables). Newsletter : jusqu'au retrait du consentement. Cookies : 13 mois maximum."
        )
      ),
      h2("Vos droits"),
      para(
        txt(
          "Vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition. Pour les exercer, écrivez à "
        ),
        link(`mailto:${COMPANY.privacyEmail}`, COMPANY.privacyEmail),
        txt(
          ". Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)."
        )
      )
    ) as Record<string, unknown>,
    publish: true,
  },
  {
    slug: "contact",
    title: "Nous écrire",
    locale,
    excerpt:
      "Une question, une suggestion, un projet professionnel ? Le formulaire est en bas de page.",
    meta_title: "Contact — Maison Lehena",
    meta_description:
      "Contactez Maison Lehena par formulaire, email ou téléphone. Réponse sous 48 h ouvrées.",
    og_image_url:
      "https://lehena.fr/wp-content/uploads/2022/01/lehenaecommerce-solidairefr-logo-1600954710-300x90.jpg",
    content: doc(
      h2("Trois façons de nous joindre"),
      para(
        txt(
          "Le plus rapide : le formulaire ci-dessous. Nous lisons chaque message et répondons sous 48 heures ouvrées."
        )
      ),
      h3("Par email"),
      para(
        txt("Service client : "),
        link("mailto:contact@lehena.fr", "contact@lehena.fr"),
        txt(" — Presse : "),
        link("mailto:presse@lehena.fr", "presse@lehena.fr"),
        txt(" — Réservations atelier : "),
        link("mailto:visites@lehena.fr", "visites@lehena.fr")
      ),
      h3("Par téléphone"),
      para(
        txt(
          "05 59 00 00 00 — du lundi au vendredi, 9 h – 18 h. (Fermé jours fériés.)"
        )
      ),
      h3("À l'atelier"),
      para(
        txt(
          "Atelier & boutique : Bourg, 64470 Laguinge (Soule, Pays Basque). Ouverte le samedi de 9 h à 13 h (visite guidée uniquement sur rendez-vous)."
        )
      )
    ) as Record<string, unknown>,
    publish: true,
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
    const existing = await pagesService.listPages({
      slug: seed.slug,
      locale: seed.locale ?? locale,
    })

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
