import type { ProductSeed } from "./types"

// ─── Jambons d'Iparralde (5 produits) ────────────────────────────────

const JAMBONS: ProductSeed[] = [
  {
    handle: "jambon-orhi-24-mois",
    image_filename: "orhi-entier-os.jpg",
    title: "Jambon Orhi 24 mois",
    subtitle: "Race Duroc · Iparralde · sans nitrite",
    description:
      "Notre jambon signature. Affiné 24 mois au sel sec de Salies-de-Béarn dans nos caves du Pays Basque. Race Duroc nourrie aux céréales locales, sans nitrite ajouté. Une pièce d'exception, marquée par les saveurs longues de l'affinage prolongé.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["jambons-iparralde/orhi-entier", "jambons-iparralde"],
    variants: [
      {
        title: "Entier avec os",
        sku: "ORHI24-ENT-OS",
        price_eur: 320,
        weight_grams: 7500,
        format: "entier_os",
        initial_stock: 8,
      },
      {
        title: "Entier désossé",
        sku: "ORHI24-ENT-DES",
        price_eur: 360,
        weight_grams: 6000,
        format: "entier_desosse",
        initial_stock: 10,
      },
      {
        title: "Demi",
        sku: "ORHI24-DEMI",
        price_eur: 195,
        weight_grams: 3000,
        format: "demi",
        initial_stock: 12,
      },
      {
        title: "Quart",
        sku: "ORHI24-QUART",
        price_eur: 105,
        weight_grams: 1500,
        format: "quart",
        initial_stock: 18,
      },
      {
        title: "Tranches 100g",
        sku: "ORHI24-TR-100",
        price_eur: 12,
        weight_grams: 100,
        format: "tranches_100g",
        initial_stock: 50,
      },
    ],
    details: {
      aging_months: 24,
      origin: "Iparralde",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      conservation_days_after_opening: 30,
      ddm_days: 60,
      cure_method: "Sel sec de Salies-de-Béarn",
      nutritional: {
        energy_kcal: 305,
        fat: 19,
        fat_saturated: 7,
        protein: 32,
        salt: 5.2,
      },
      ingredients: "Viande de porc Duroc (98%), sel de Salies-de-Béarn (2%).",
      terroir_story:
        "Orhi est le sommet emblématique d'Iparralde. Nos cochons Duroc paissent dans ses vallées, nourris d'orge et de maïs basques. 24 mois d'affinage en cave naturelle leur donnent une bouche profonde et persistante.",
      pairings_tags: ["patxaran", "piment-espelette", "vin-rouge-irouleguy"],
      seo_title: "Jambon Orhi 24 mois sans nitrite | Race Duroc | Lehena",
      seo_description:
        "Jambon Orhi 24 mois, race Duroc, affiné au sel de Salies-de-Béarn. Sans nitrite. Entier, désossé, demi, quart ou tranches. Livraison Chronofresh.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "jambon-orhi-18-mois",
    image_filename: "orhi-entier-os.jpg",
    title: "Jambon Orhi 18 mois",
    subtitle: "Race Duroc · sans nitrite",
    description:
      "Affinage intermédiaire qui équilibre douceur et caractère. Idéal pour découvrir notre signature, ou pour les amateurs qui préfèrent un jambon plus tendre que le 24 mois.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["jambons-iparralde/orhi-entier", "jambons-iparralde"],
    variants: [
      {
        title: "Entier avec os",
        sku: "ORHI18-ENT-OS",
        price_eur: 260,
        weight_grams: 7200,
        format: "entier_os",
        initial_stock: 10,
      },
      {
        title: "Entier désossé",
        sku: "ORHI18-ENT-DES",
        price_eur: 295,
        weight_grams: 5800,
        format: "entier_desosse",
        initial_stock: 12,
      },
      {
        title: "Demi",
        sku: "ORHI18-DEMI",
        price_eur: 159,
        weight_grams: 2900,
        format: "demi",
        initial_stock: 15,
      },
      {
        title: "Tranches 100g",
        sku: "ORHI18-TR-100",
        price_eur: 10,
        weight_grams: 100,
        format: "tranches_100g",
        initial_stock: 60,
      },
    ],
    details: {
      aging_months: 18,
      origin: "Iparralde",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      conservation_days_after_opening: 30,
      ddm_days: 60,
      cure_method: "Sel sec de Salies-de-Béarn",
      ingredients: "Viande de porc Duroc (98%), sel de Salies-de-Béarn (2%).",
      pairings_tags: ["patxaran", "piment-espelette"],
      seo_title: "Jambon Orhi 18 mois sans nitrite | Lehena",
      seo_description:
        "Jambon Orhi 18 mois affiné, race Duroc, sans nitrite. Entier, désossé, demi ou tranches. Du Pays Basque, livraison Chronofresh.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "jambon-orhi-15-mois",
    image_filename: "orhi-entier-os.jpg",
    title: "Jambon Orhi 15 mois",
    subtitle: "Première cuvée · sans nitrite",
    description:
      "Notre première cuvée, généreuse et accessible. Le jambon idéal pour la consommation quotidienne, en sandwich, sur un plat de pâtes ou en planche.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["jambons-iparralde/orhi-entier", "jambons-iparralde"],
    variants: [
      {
        title: "Entier avec os",
        sku: "ORHI15-ENT-OS",
        price_eur: 215,
        weight_grams: 7000,
        format: "entier_os",
        initial_stock: 12,
      },
      {
        title: "Demi",
        sku: "ORHI15-DEMI",
        price_eur: 130,
        weight_grams: 2800,
        format: "demi",
        initial_stock: 18,
      },
      {
        title: "Tranches 100g",
        sku: "ORHI15-TR-100",
        price_eur: 8,
        weight_grams: 100,
        format: "tranches_100g",
        initial_stock: 80,
      },
      {
        title: "Tranches 200g",
        sku: "ORHI15-TR-200",
        price_eur: 15,
        weight_grams: 200,
        format: "tranches_200g",
        initial_stock: 40,
      },
    ],
    details: {
      aging_months: 15,
      origin: "Iparralde",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      conservation_days_after_opening: 30,
      ddm_days: 60,
      cure_method: "Sel sec de Salies-de-Béarn",
      ingredients: "Viande de porc Duroc (98%), sel de Salies-de-Béarn (2%).",
      seo_title: "Jambon Orhi 15 mois sans nitrite | Lehena",
      seo_description:
        "Jambon Orhi 15 mois, première cuvée Lehena. Race Duroc, sans nitrite, à découvrir entier, demi ou en tranches.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "selection-chef-jambon-orhi-24",
    image_filename: "orhi-tranches.jpg",
    title: "Sélection du Chef · Orhi 24 mois 200g tranches",
    description:
      "Sachet tranché finement de notre Orhi 24 mois, sélectionné par notre maître affineur.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["jambons-iparralde/tranches", "jambons-iparralde"],
    variants: [
      {
        title: "Sachet 200g",
        sku: "ORHI24-CHEF-200",
        price_eur: 28,
        weight_grams: 200,
        format: "tranches_200g",
        initial_stock: 60,
      },
    ],
    details: {
      aging_months: 24,
      origin: "Iparralde",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      conservation_days_after_opening: 5,
      ddm_days: 35,
      cure_method: "Sel sec de Salies-de-Béarn",
      ingredients: "Viande de porc Duroc (98%), sel de Salies-de-Béarn (2%).",
      seo_title: "Tranches Orhi 24 mois 200g · sélection chef | Lehena",
      seo_description:
        "Sachet de tranches fines Orhi 24 mois, conditionné sous-vide. Affinage long, sans nitrite. Format 200g pratique.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "os-de-jambon",
    image_filename: "os-jambon.jpg",
    title: "Os de jambon",
    description:
      "Os de jambon Orhi, parfait pour parfumer un bouillon, un pot-au-feu, une garbure ou une soupe de haricots. Conservez au réfrigérateur après ouverture du sachet.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["jambons-iparralde"],
    variants: [
      {
        title: "Pièce",
        sku: "OS-JAMBON",
        price_eur: 6,
        weight_grams: 800,
        format: "piece",
        initial_stock: 40,
      },
    ],
    details: {
      origin: "Pays Basque",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 180,
      ingredients: "Os de jambon de porc Duroc, sel de Salies-de-Béarn.",
      seo_title: "Os de jambon basque · pour bouillons | Lehena",
      seo_description:
        "Os de jambon Orhi pour parfumer bouillons, soupes, garbures et pot-au-feu. Conservation longue à température ambiante.",
      og_image_url: null,
      noindex: false,
    },
  },
]

// ─── Salaisons (3 produits) ──────────────────────────────────────────

const SALAISONS: ProductSeed[] = [
  {
    handle: "ventreche-roulee",
    image_filename: "ventreche-roulee.jpg",
    title: "Ventrêche roulée 6 mois",
    subtitle: "Poitrine séchée · sans nitrite",
    description:
      "Poitrine de porc Duroc roulée et séchée 6 mois. Tranchez fin pour l'apéro ou en lardons pour vos plats. Sans nitrite, sel de Salies.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["salaisons/ventreches", "salaisons"],
    variants: [
      {
        title: "Entière 1kg",
        sku: "VENT-ENT-1KG",
        price_eur: 38,
        weight_grams: 1000,
        format: "piece",
        initial_stock: 25,
      },
      {
        title: "Demie 500g",
        sku: "VENT-DEMI-500",
        price_eur: 22,
        weight_grams: 500,
        format: "demi",
        initial_stock: 30,
      },
      {
        title: "Tranches 100g",
        sku: "VENT-TR-100",
        price_eur: 6.5,
        weight_grams: 100,
        format: "tranches_100g",
        initial_stock: 80,
      },
    ],
    details: {
      aging_months: 6,
      origin: "Pays Basque",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      ddm_days: 45,
      ingredients: "Poitrine de porc Duroc, sel de Salies-de-Béarn, poivre.",
      seo_title: "Ventrêche roulée sans nitrite | Lehena",
      seo_description:
        "Ventrêche de porc Duroc séchée et roulée 6 mois. Sans nitrite. Format entier, demi ou tranches.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "ttipini-piment-espelette",
    image_filename: "ttipini.jpg",
    title: "Ttipiñi au piment d'Espelette",
    subtitle: "Saucisse sèche au piment d'Espelette",
    description:
      "Spécialité charcutière basque : petite saucisse sèche relevée au piment d'Espelette AOP. À déguster en tranches fines à l'apéritif, en tapas, ou avec un verre de patxaran.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["salaisons/secs", "salaisons"],
    variants: [
      {
        title: "Pièce 200g",
        sku: "TTIPINI-200",
        price_eur: 9.5,
        weight_grams: 200,
        format: "piece",
        initial_stock: 80,
      },
    ],
    details: {
      origin: "Pays Basque",
      breed: "Duroc",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 90,
      ingredients:
        "Porc Duroc, sel de Salies-de-Béarn, piment d'Espelette AOP, poivre, ail.",
      pairings_tags: ["patxaran", "piment-espelette"],
      seo_title: "Ttipiñi au piment d'Espelette AOP | Lehena",
      seo_description:
        "Ttipiñi, petite saucisse sèche basque au piment d'Espelette AOP. Sans nitrite, séchage traditionnel.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "saucisses-mouton-piperade",
    image_filename: "saucisses-mouton.jpg",
    title: "Saucisses de Mouton à la Piperade",
    subtitle: "Mouton Bürü Beltza · à cuire",
    description:
      "Trois saucisses fraîches de mouton Bürü Beltza, farcies à la piperade basque. À poêler quelques minutes de chaque côté, à accompagner de pommes de terre sautées ou d'un riz parfumé.",
    product_type: "alimentaire",
    shipping_kind: "fresh",
    category_handles: ["salaisons"],
    variants: [
      {
        title: "Sachet 360g · 3 pièces",
        sku: "SAUC-MOUTON-360",
        price_eur: 12,
        weight_grams: 360,
        format: "piece",
        initial_stock: 50,
      },
    ],
    details: {
      origin: "Pays Basque",
      breed: "Autre",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "fresh",
      conservation_days_after_opening: 2,
      ddm_days: 14,
      ingredients:
        "Mouton Bürü Beltza (70%), poivron, tomate, oignon, ail, piment d'Espelette AOP, sel.",
      seo_title: "Saucisses de mouton Bürü Beltza à la piperade | Lehena",
      seo_description:
        "Saucisses fraîches de mouton Bürü Beltza farcies à la piperade basque. Sachet 360g (3 pièces), à poêler.",
      og_image_url: null,
      noindex: false,
    },
  },
]

// ─── Patxaran & spiritueux (2 produits) ──────────────────────────────

const PATXARAN: ProductSeed[] = [
  {
    handle: "patxaran-traditionnel-50cl",
    image_filename: "patxaran.jpg",
    title: "Patxaran des Laminak 50cl",
    subtitle: "Recette traditionnelle basque",
    description:
      "Notre patxaran maison, infusé avec prunelles sauvages cueillies au pied des Pyrénées et anis vert. Mûri 6 mois en bonbonne. À déguster glacé en digestif ou en spritz.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["patxaran-spiritueux"],
    variants: [
      {
        title: "Bouteille 50cl",
        sku: "PATX-TRAD-50",
        price_eur: 26,
        weight_grams: 850,
        format: "bouteille_500ml",
        initial_stock: 80,
      },
    ],
    details: {
      origin: "Pays Basque",
      allergens: [],
      nitrite_free: false,
      conservation_temp: "ambient",
      ddm_days: 730,
      ingredients: "Eau-de-vie d'anis (50%), prunelles sauvages, sucre.",
      pairings_tags: ["chorizo-doux", "fromage-brebis"],
      seo_title: "Patxaran traditionnel 50cl maison | Lehena",
      seo_description:
        "Patxaran maison Lehena, prunelles sauvages et anis, recette traditionnelle des Laminak. Bouteille 50cl.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "patxaran-reserve-70cl",
    image_filename: "patxaran.jpg",
    title: "Patxaran Réserve 70cl",
    subtitle: "Vieillissement long",
    description:
      "Cuvée spéciale, vieillie 18 mois pour plus de rondeur et de notes confites. Format 70cl, idéal en cadeau.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["patxaran-spiritueux"],
    variants: [
      {
        title: "Bouteille 70cl",
        sku: "PATX-RESERVE-70",
        price_eur: 42,
        weight_grams: 1200,
        format: "bouteille_700ml",
        initial_stock: 40,
      },
    ],
    details: {
      origin: "Pays Basque",
      allergens: [],
      nitrite_free: false,
      conservation_temp: "ambient",
      ddm_days: 1095,
      ingredients: "Eau-de-vie d'anis, prunelles sauvages, sucre.",
      seo_title: "Patxaran Réserve 70cl 18 mois | Lehena",
      seo_description:
        "Cuvée Réserve du patxaran Lehena, vieillie 18 mois, format 70cl. Notes confites, rondeur. Idéal cadeau.",
      og_image_url: null,
      noindex: false,
    },
  },
]

// ─── Plats cuisinés (2 produits) ─────────────────────────────────────

const PLATS: ProductSeed[] = [
  {
    handle: "navarin-agneau-buru-beltza",
    title: "Navarin d'Agneau Bürü Beltza",
    subtitle: "Agneau Bürü Beltza · plat mijoté",
    description:
      "Navarin d'agneau Bürü Beltza (race basque à tête noire) mijoté lentement avec petits légumes du Sud-Ouest. Bocal verre stérilisé, à réchauffer doucement.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["plats-cuisines"],
    variants: [
      {
        title: "Bocal 360g · 1 pers.",
        sku: "NAVARIN-360",
        price_eur: 14,
        weight_grams: 420,
        format: "boite_400g",
        initial_stock: 60,
      },
    ],
    details: {
      origin: "Pays Basque",
      breed: "Autre",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      conservation_days_after_opening: 2,
      ddm_days: 540,
      ingredients:
        "Agneau Bürü Beltza (50%), pomme de terre, carotte, oignon, ail, bouquet garni, vin blanc, sel, poivre.",
      seo_title: "Navarin d'agneau Bürü Beltza en bocal | Lehena",
      seo_description:
        "Navarin d'agneau Bürü Beltza, race basque à tête noire, mijoté à l'atelier en bocal 360g.",
      og_image_url: null,
      noindex: false,
    },
    image_filename: "navarin-agneau.jpg",
  },
  {
    handle: "tajine-mouton-buru-beltza",
    title: "Tajine de Mouton Bürü Beltza",
    subtitle: "Mouton Bürü Beltza · plat mijoté",
    description:
      "Tajine de mouton Bürü Beltza aux épices douces et fruits secs. Mijoté longuement au gingembre, cannelle et cumin. Bocal verre stérilisé.",
    product_type: "alimentaire",
    shipping_kind: "ambient",
    category_handles: ["plats-cuisines"],
    variants: [
      {
        title: "Bocal 360g · 1 pers.",
        sku: "TAJINE-360",
        price_eur: 14,
        weight_grams: 420,
        format: "boite_400g",
        initial_stock: 60,
      },
    ],
    details: {
      origin: "Pays Basque",
      breed: "Autre",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      conservation_days_after_opening: 2,
      ddm_days: 540,
      ingredients:
        "Mouton Bürü Beltza (50%), oignon, tomate, abricot sec, raisin, gingembre, cannelle, cumin, ail, huile d'olive, sel.",
      seo_title: "Tajine de mouton Bürü Beltza en bocal | Lehena",
      seo_description:
        "Tajine de mouton Bürü Beltza aux épices douces et fruits secs, mijoté en bocal 360g.",
      og_image_url: null,
      noindex: false,
    },
    image_filename: "tajine-mouton.jpg",
  },
]

// ─── Accessoires (4 produits) ────────────────────────────────────────

const ACCESSOIRES: ProductSeed[] = [
  {
    handle: "planche-jambon-bois",
    image_filename: "planche-jambon.jpg",
    title: "Planche à jambon en hêtre",
    description:
      "Planche en bois de hêtre massif, gravée du logo Lehena. Surface de découpe robuste, dimensions 50 × 25 cm.",
    product_type: "accessoire",
    shipping_kind: "ambient",
    category_handles: ["accessoires"],
    variants: [
      {
        title: "Standard",
        sku: "ACC-PLAN-50",
        price_eur: 65,
        weight_grams: 1800,
        format: "unite",
        initial_stock: 30,
      },
    ],
    details: {
      origin: "France",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 3650,
      ingredients: "Bois de hêtre massif.",
      seo_title: "Planche à jambon en hêtre 50cm | Lehena",
      seo_description:
        "Planche à jambon en hêtre massif gravée Lehena, 50×25 cm. L'outil pour découper un jambon entier.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "support-jambon-metal",
    image_filename: "support-jambon.jpg",
    title: "Support à jambon métal",
    description:
      "Support métallique avec griffe ajustable. Stabilité maximale pour la découpe au couteau.",
    product_type: "accessoire",
    shipping_kind: "ambient",
    category_handles: ["accessoires"],
    variants: [
      {
        title: "Standard",
        sku: "ACC-SUPP",
        price_eur: 85,
        weight_grams: 2200,
        format: "unite",
        initial_stock: 25,
      },
    ],
    details: {
      origin: "Espagne",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 3650,
      ingredients: "Acier inoxydable.",
      seo_title: "Support à jambon métal avec griffe | Lehena",
      seo_description:
        "Support à jambon métallique avec griffe ajustable, pour découper un jambon entier en toute sécurité.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "couteau-jambon",
    image_filename: "planche-jambon.jpg",
    title: "Couteau à jambon professionnel",
    description:
      "Lame longue, fine et flexible. Manche en bois. Le couteau dédié aux jambons entiers.",
    product_type: "accessoire",
    shipping_kind: "ambient",
    category_handles: ["accessoires"],
    variants: [
      {
        title: "Lame 30cm",
        sku: "ACC-COUT",
        price_eur: 55,
        weight_grams: 220,
        format: "unite",
        initial_stock: 40,
      },
    ],
    details: {
      origin: "France",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 3650,
      ingredients: "Acier inoxydable, manche en bois.",
      seo_title: "Couteau à jambon professionnel lame 30cm | Lehena",
      seo_description:
        "Couteau à jambon professionnel, lame fine 30cm flexible. Manche en bois. L'outil indispensable.",
      og_image_url: null,
      noindex: false,
    },
  },
  {
    handle: "aerateur-vin-patxaran",
    image_filename: "aerateur.jpg",
    title: "Aérateur pour vin ou patxaran",
    description:
      "Aérateur conçu pour les vins puissants et le patxaran. À placer directement sur le goulot : aère et révèle les arômes au moment du service.",
    product_type: "accessoire",
    shipping_kind: "ambient",
    category_handles: ["accessoires"],
    variants: [
      {
        title: "Pièce",
        sku: "ACC-AERA",
        price_eur: 18,
        weight_grams: 90,
        format: "unite",
        initial_stock: 80,
      },
    ],
    details: {
      origin: "France",
      allergens: [],
      nitrite_free: true,
      conservation_temp: "ambient",
      ddm_days: 3650,
      ingredients: "Verre borosilicate.",
      seo_title: "Aérateur pour vin ou patxaran | Lehena",
      seo_description:
        "Aérateur à placer sur le goulot, pour vins puissants et patxaran. Révèle les arômes au service.",
      og_image_url: null,
      noindex: false,
    },
  },
]

export const ALL_PRODUCTS: ProductSeed[] = [
  ...JAMBONS,
  ...SALAISONS,
  ...PATXARAN,
  ...PLATS,
  ...ACCESSOIRES,
]
