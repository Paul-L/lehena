import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"

import type { MedusaContainer } from "@medusajs/framework/types"

// Lehena category tree (Phase 1 sub-passe D).
// SEO custom fields are stored on Medusa's native ProductCategory.metadata
// (JSON) for Phase 1 — this avoids adding another module entity + migration.
// If we later need to filter products by category SEO attributes, we'll
// promote these to a `category_details` link inside the catalog module.

interface CategorySeed {
  name: string
  handle: string
  description: string
  metadata: {
    seo_title: string
    seo_description: string
    seo_keywords: string[]
    // Reserved for Phase 4 multi-locale.
    seo_title_en?: string
    seo_description_en?: string
  }
  children?: CategorySeed[]
}

const CATEGORY_TREE: CategorySeed[] = [
  {
    name: "Jambons d'Iparralde",
    handle: "jambons-iparralde",
    description:
      "Nos jambons Orhi, élevés au Pays Basque, race Duroc, affinés au sel de Salies-de-Béarn sans nitrite ajouté. Maturation 15, 18 ou 24 mois selon la cuvée. Découvrez le savoir-faire Lehena, transmis depuis 1974, sur des cochons nourris aux céréales locales.",
    metadata: {
      seo_title:
        "Jambons d'Iparralde sans nitrite | Race Duroc affinée 24 mois | Lehena",
      seo_description:
        "Jambons Orhi du Pays Basque, race Duroc, affinés sans nitrite au sel de Salies-de-Béarn. Cuvées 15, 18 ou 24 mois. Livraison Chronofresh 24-48h.",
      seo_keywords: [
        "jambon sans nitrite",
        "jambon pays basque",
        "jambon affiné 24 mois",
        "race Duroc",
        "jambon iparralde",
      ],
    },
    children: [
      {
        name: "Orhi entier",
        handle: "jambons-iparralde/orhi-entier",
        description:
          "Jambon Orhi entier, avec ou sans os, présenté dans un pochon de tissu. Pièces de 5 à 7,5 kg selon la coupe. Idéal pour la table de fête, la dégustation tranche par tranche au couteau.",
        metadata: {
          seo_title: "Jambon Orhi entier sans nitrite — 5 à 7,5 kg | Lehena",
          seo_description:
            "Achetez un jambon Orhi entier (avec ou sans os) affiné au Pays Basque. Race Duroc, sans nitrite. Livraison Chronofresh en 24-48h.",
          seo_keywords: [
            "jambon entier",
            "jambon avec os",
            "jambon désossé",
            "jambon Orhi",
          ],
        },
      },
      {
        name: "Demi-jambons & quarts",
        handle: "jambons-iparralde/portions",
        description:
          "Portions de jambon Orhi en demi ou en quart, parfaites pour un usage régulier sans engager une pièce entière. Affinage strictement identique au jambon entier.",
        metadata: {
          seo_title: "Demi-jambon & quart de jambon Pays Basque | Lehena",
          seo_description:
            "Demi-jambons et quarts de jambon Orhi sans nitrite, race Duroc, affinés au sel de Salies. Pratique pour la famille, idéal en pochon cadeau.",
          seo_keywords: [
            "demi jambon basque",
            "quart de jambon",
            "portion jambon",
          ],
        },
      },
      {
        name: "Tranches",
        handle: "jambons-iparralde/tranches",
        description:
          "Jambon Orhi tranché finement à la main, conditionné sous-vide. Format 100 g ou 200 g, prêt à servir. Conservez au frais et sortez 20 minutes avant de déguster.",
        metadata: {
          seo_title: "Jambon Orhi tranché — sachets 100g & 200g | Lehena",
          seo_description:
            "Tranches fines de jambon Orhi sans nitrite, race Duroc, affinage 24 mois. Sachets 100g ou 200g sous-vide. Livraison réfrigérée Chronofresh.",
          seo_keywords: [
            "jambon tranché",
            "tranches jambon basque",
            "jambon prétranché",
          ],
        },
      },
    ],
  },
  {
    name: "Salaisons",
    handle: "salaisons",
    description:
      "Ventrêches, saucissons, coppa, lonzo et chorizo doux : la charcuterie sèche Lehena élaborée sans nitrite, sel de Salies, séchage long. Chaque pièce signée à l'atelier du Pays Basque.",
    metadata: {
      seo_title: "Salaisons artisanales Pays Basque sans nitrite | Lehena",
      seo_description:
        "Ventrêche, saucisson, coppa, lonzo, chorizo doux : la charcuterie sèche Lehena. Salaisons traditionnelles sans nitrite, élevage et fabrication au Pays Basque.",
      seo_keywords: [
        "salaisons pays basque",
        "charcuterie sans nitrite",
        "saucisson basque",
        "ventrêche sèche",
      ],
    },
    children: [
      {
        name: "Ventrêches",
        handle: "salaisons/ventreches",
        description:
          "Poitrine de porc Duroc séchée et roulée, à trancher fin pour l'apéro ou à couper en lardons pour la cuisine. Format entier ou demi.",
        metadata: {
          seo_title: "Ventrêche Pays Basque sans nitrite | Lehena",
          seo_description:
            "Ventrêche séchée Lehena, race Duroc, sans nitrite. Format entier ou demi. Parfait pour l'apéritif tranché fin ou en lardons cuisinés.",
          seo_keywords: [
            "ventrêche pays basque",
            "poitrine séchée",
            "ventrêche basque",
          ],
        },
      },
      {
        name: "Saucissons & secs",
        handle: "salaisons/secs",
        description:
          "Saucissons, coppa, lonzo et chorizo doux Lehena. Séchage long, sans nitrite, sans additif inutile. À déguster nature ou avec un patxaran.",
        metadata: {
          seo_title: "Saucisson, chorizo & coppa sans nitrite | Lehena",
          seo_description:
            "Saucissons, coppa, lonzo et chorizo doux maison Lehena. Sans nitrite, séchage long traditionnel. Charcuterie sèche du Pays Basque.",
          seo_keywords: [
            "saucisson basque",
            "chorizo doux",
            "coppa basque",
            "lonzo",
          ],
        },
      },
    ],
  },
  {
    name: "Patxaran & spiritueux",
    handle: "patxaran-spiritueux",
    description:
      "Le patxaran maison Lehena, élaboré selon la recette des Laminak (les fées basques) avec prunelles sauvages et anis. Nos eaux-de-vie locales complètent la sélection.",
    metadata: {
      seo_title: "Patxaran maison & eaux-de-vie du Pays Basque | Lehena",
      seo_description:
        "Patxaran traditionnel basque infusé avec prunelles sauvages et anis selon la recette des Laminak. Sélection d'eaux-de-vie locales artisanales.",
      seo_keywords: [
        "patxaran",
        "patxaran maison",
        "liqueur basque",
        "spiritueux pays basque",
      ],
    },
  },
  {
    name: "Épicerie fine",
    handle: "epicerie-fine",
    description:
      "Piment d'Espelette AOP, sel de Salies-de-Béarn, piperade artisanale, confitures de cerise noire d'Itxassou : l'épicerie d'accompagnement de la table basque.",
    metadata: {
      seo_title: "Épicerie fine Pays Basque artisanale | Lehena",
      seo_description:
        "Piment d'Espelette AOP, sel de Salies-de-Béarn, piperade, confiture cerise noire d'Itxassou. L'épicerie qui accompagne nos jambons et salaisons.",
      seo_keywords: [
        "épicerie pays basque",
        "piment d'Espelette AOP",
        "sel de Salies",
        "piperade artisanale",
      ],
    },
  },
  {
    name: "Plats cuisinés",
    handle: "plats-cuisines",
    description:
      "Axoa de veau, poulet basquaise, garbure : les plats traditionnels du Sud-Ouest mijotés à l'atelier, en bocaux verre stérilisés à conserver à température ambiante.",
    metadata: {
      seo_title: "Plats cuisinés basques en bocaux artisanaux | Lehena",
      seo_description:
        "Axoa de veau, poulet basquaise, garbure : les plats traditionnels du Sud-Ouest mijotés à l'atelier Lehena, stérilisés en bocaux verre.",
      seo_keywords: [
        "axoa de veau",
        "poulet basquaise",
        "garbure",
        "plats basques",
      ],
    },
  },
  {
    name: "Coffrets & cadeaux",
    handle: "coffrets-cadeaux",
    description:
      "Sélections cadeaux Lehena : coffret Découverte, Tradition ou Prestige. Boîte cartonnée, message personnalisé en option. Livraison directe au destinataire.",
    metadata: {
      seo_title: "Coffrets cadeaux gastronomie Pays Basque | Lehena",
      seo_description:
        "Coffrets cadeaux Lehena : Découverte, Tradition, Prestige. Jambons, salaisons et patxaran à offrir. Message et emballage personnalisés.",
      seo_keywords: [
        "coffret cadeau pays basque",
        "panier cadeau gastronomie",
        "coffret gourmand basque",
      ],
    },
  },
  {
    name: "Accessoires",
    handle: "accessoires",
    description:
      "Planche à jambon, support à griffe, couteau à jambon fin et bien aiguisé : les essentiels pour servir un jambon entier dans les règles de l'art.",
    metadata: {
      seo_title: "Planche, support & couteau à jambon | Lehena",
      seo_description:
        "Planche à jambon, support métal à griffe, couteau à jambon : l'équipement nécessaire pour découper un jambon entier comme un pro.",
      seo_keywords: [
        "planche à jambon",
        "support à jambon",
        "couteau à jambon",
      ],
    },
  },
]

export interface SeededCategories {
  byHandle: Map<string, string>
}

export async function seedCategories(
  container: MedusaContainer
): Promise<SeededCategories> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  logger.info("[seed.categories] 7 root categories + 5 sub-categories + SEO")

  const { data: existing } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const byHandle = new Map<string, string>(
    (existing ?? []).map((c) => [c.handle, c.id])
  )

  async function ensureCategory(
    seed: CategorySeed,
    parentId: string | null
  ): Promise<string> {
    let id = byHandle.get(seed.handle)
    if (!id) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: seed.name,
              handle: seed.handle,
              description: seed.description,
              parent_category_id: parentId,
              is_active: true,
              metadata: seed.metadata,
            },
          ],
        },
      })
      id = result[0].id
      byHandle.set(seed.handle, id)
    }
    if (seed.children) {
      for (const child of seed.children) {
        await ensureCategory(child, id)
      }
    }
    return id
  }

  for (const root of CATEGORY_TREE) {
    await ensureCategory(root, null)
  }

  return { byHandle }
}
