import { describe, expect, it } from "@jest/globals"

import { mapCustomer } from "../mappers/customer"
import {
  mapCategoryToLehena,
  mapProduct,
  mapProductDetails,
} from "../mappers/product"
import {
  mapCategoryRedirect,
  mapConsolidatedProductRedirect,
  mapProductRedirect,
  STATIC_PAGE_REDIRECTS,
} from "../mappers/redirect"

import type { LegacyCustomer, LegacyProduct } from "../types"

const baseProduct: LegacyProduct = {
  id: 101,
  slug: "jambon-orhi-18-mois",
  name: "Jambon Orhi 18 mois",
  type: "variable",
  status: "publish",
  description: "<p>Notre jambon <strong>phare</strong>.</p>",
  short_description: "Sec, doux",
  price: null,
  sku: null,
  weight_grams: 7000,
  categories: [
    { id: 1, slug: "jambons-iparralde", name: "Jambons d'Iparralde" },
  ],
  tags: ["sans-nitrite", "race-basque"],
  images: [
    { src: "https://wp.lehena.fr/orhi-1.jpg", alt: null },
    { src: "https://wp.lehena.fr/orhi-2.jpg", alt: null },
  ],
  variations: [
    {
      id: 1001,
      sku: "JMB-ORHI-DEMI",
      price: "129.00",
      weight_grams: 2500,
      attributes: { format: "Demi" },
    },
    {
      id: 1002,
      sku: "JMB-ORHI-ENT",
      price: "299.00",
      weight_grams: 7000,
      attributes: { format: "Entier" },
    },
  ],
  meta: {
    aging_months: 18,
    origin: "Vallée des Aldudes",
    breed: "Kintoa",
    nitrite_free: true,
    _yoast_wpseo_title: "Jambon Orhi — Lehena",
    _yoast_wpseo_metadesc: "Description SEO",
  },
}

describe("mapCategoryToLehena", () => {
  it("routes jambons", () => {
    expect(mapCategoryToLehena(["jambons-iparralde"])).toBe("jambons-iparralde")
    expect(mapCategoryToLehena(["jambon-orhi"])).toBe("jambons-iparralde")
  })
  it("routes accessoires", () => {
    expect(mapCategoryToLehena(["accessoire"])).toBe("accessoires")
    expect(mapCategoryToLehena(["planche"])).toBe("accessoires")
    expect(mapCategoryToLehena(["couteau"])).toBe("accessoires")
  })
  it("routes saucissons / chorizos to salaisons", () => {
    expect(mapCategoryToLehena(["chorizo"])).toBe("salaisons")
    expect(mapCategoryToLehena(["saucisson"])).toBe("salaisons")
  })
  it("routes patxaran + spiritueux", () => {
    expect(mapCategoryToLehena(["patxaran"])).toBe("patxaran-spiritueux")
    expect(mapCategoryToLehena(["liqueur"])).toBe("patxaran-spiritueux")
  })
  it("routes coffret-cadeau", () => {
    expect(mapCategoryToLehena(["coffret"])).toBe("coffrets-cadeaux")
    expect(mapCategoryToLehena(["cadeau"])).toBe("coffrets-cadeaux")
  })
  it("falls back to epicerie-fine", () => {
    expect(mapCategoryToLehena(["miel"])).toBe("epicerie-fine")
    expect(mapCategoryToLehena([])).toBe("epicerie-fine")
  })
  it("picks the first matching slug then the first matching rule", () => {
    // Iteration is slug-first then rule-first: "coffret" hits the
    // coffrets-cadeaux rule before saucisson is considered.
    expect(mapCategoryToLehena(["coffret", "saucisson"])).toBe(
      "coffrets-cadeaux"
    )
    expect(mapCategoryToLehena(["saucisson", "coffret"])).toBe("salaisons")
  })
  it("name overrides the slug for accessoires filed under meat categories", () => {
    // WC files these under Jambon / Patxaran; the product name wins.
    expect(
      mapCategoryToLehena(
        ["jambon-d-iparralde"],
        "Planche de découpe avec son couteau"
      )
    ).toBe("accessoires")
    expect(
      mapCategoryToLehena(
        ["jambon-d-iparralde"],
        "Support pour jambon avec couteau"
      )
    ).toBe("accessoires")
    expect(
      mapCategoryToLehena(["patxaran-production-artisanale"], "Aérateur de vin")
    ).toBe("accessoires")
  })
  it("name overrides route prepared dishes to plats-cuisines", () => {
    expect(
      mapCategoryToLehena(["notre-epicerie"], "Navarin d'Agneau Bürü Beltza")
    ).toBe("plats-cuisines")
    expect(
      mapCategoryToLehena(["notre-epicerie"], "Tajine de Mouton Bürü Beltza")
    ).toBe("plats-cuisines")
    expect(
      mapCategoryToLehena(
        ["notre-epicerie"],
        "3 Saucisses de Mouton à la Piperade"
      )
    ).toBe("plats-cuisines")
    expect(mapCategoryToLehena(["notre-epicerie"], "Axoa de Porc")).toBe(
      "plats-cuisines"
    )
  })
})

describe("mapProductDetails", () => {
  it("extracts aging months as number", () => {
    expect(mapProductDetails(baseProduct).aging_months).toBe(18)
  })
  it("detects nitrite_free from explicit meta", () => {
    expect(mapProductDetails(baseProduct).nitrite_free).toBe(true)
  })
  it("falls back to tag heuristic for nitrite_free", () => {
    const p = { ...baseProduct, meta: {}, tags: ["sans-nitrite"] }
    expect(mapProductDetails(p).nitrite_free).toBe(true)
  })
  it("classifies fresh conservation_temp for jambons", () => {
    expect(mapProductDetails(baseProduct).conservation_temp).toBe("fresh")
  })
  it("classifies ambient for patxaran", () => {
    const p = { ...baseProduct, name: "Patxaran des Aldudes", meta: {} }
    expect(mapProductDetails(p).conservation_temp).toBe("ambient")
  })
})

describe("mapProduct", () => {
  it("emits one variant per legacy variation", () => {
    const m = mapProduct(baseProduct)
    expect(m.variants).toHaveLength(2)
    expect(m.variants[0].price).toBe(129)
    expect(m.variants[1].price).toBe(299)
  })
  it("creates a synthetic variant for simple products", () => {
    const p: LegacyProduct = {
      ...baseProduct,
      type: "simple",
      variations: [],
      price: "18.90",
    }
    const m = mapProduct(p)
    expect(m.variants).toHaveLength(1)
    expect(m.variants[0].price).toBe(18.9)
    expect(m.variants[0].options.format).toBe("Unique")
  })
  it("strips HTML from description", () => {
    expect(mapProduct(baseProduct).description).toBe("Notre jambon phare.")
  })
  it("preserves SEO fields from Yoast", () => {
    const m = mapProduct(baseProduct)
    expect(m.seo_title).toBe("Jambon Orhi — Lehena")
    expect(m.seo_description).toBe("Description SEO")
  })
  it("maps draft status", () => {
    const m = mapProduct({ ...baseProduct, status: "draft" })
    expect(m.status).toBe("draft")
  })
})

describe("mapCustomer", () => {
  const baseCustomer: LegacyCustomer = {
    id: 1,
    email: "Marie.Dupont@example.com",
    first_name: "Marie",
    last_name: "Dupont",
    phone: "0612345678",
    date_created: "2023-01-01",
    billing: {
      first_name: "Marie",
      last_name: "Dupont",
      company: null,
      address_1: "12 rue Lafayette",
      address_2: null,
      city: "Bayonne",
      state: null,
      postcode: "64100",
      country: "FR",
      phone: null,
    },
    shipping: null,
    marketing_opt_in: true,
  }

  it("normalises email to lowercase", () => {
    expect(mapCustomer(baseCustomer)?.email).toBe("marie.dupont@example.com")
  })
  it("stamps migration metadata", () => {
    const m = mapCustomer(baseCustomer)
    expect(m?.metadata.migrated_from).toBe("lehena-wp")
    expect(m?.metadata.legacy_id).toBe(1)
    expect(typeof m?.metadata.migrated_at).toBe("string")
  })
  it("returns null for invalid email", () => {
    expect(mapCustomer({ ...baseCustomer, email: "" })).toBeNull()
    expect(mapCustomer({ ...baseCustomer, email: "not-email" })).toBeNull()
  })
  it("normalises country code to lowercase", () => {
    const m = mapCustomer(baseCustomer)
    expect(m?.addresses[0].country_code).toBe("fr")
  })
  it("skips empty billing address", () => {
    const m = mapCustomer({ ...baseCustomer, billing: null })
    expect(m?.addresses).toHaveLength(0)
  })
  it("respects marketing_opt_in", () => {
    expect(
      mapCustomer({ ...baseCustomer, marketing_opt_in: false })?.metadata
        .newsletter_marketing
    ).toBe(false)
  })
})

describe("redirect mappers", () => {
  it("includes the canonical static page redirects", () => {
    const fromPaths = STATIC_PAGE_REDIRECTS.map((r) => r.from_path)
    expect(fromPaths).toContain("/notre-histoire/")
    expect(fromPaths).toContain("/cgv/")
    expect(fromPaths).toContain("/contactez-nous/")
  })
  it("builds /produit/<slug>/ → /fr/products/<slug>", () => {
    const r = mapProductRedirect(baseProduct)
    expect(r.from_path).toBe("/produit/jambon-orhi-18-mois/")
    expect(r.to_path).toBe("/fr/products/jambon-orhi-18-mois")
    expect(r.status).toBe(301)
  })
  it("collapses legacy categories to the right Lehena category", () => {
    const r = mapCategoryRedirect({ legacy_slug: "planche" })
    expect(r.to_path).toBe("/fr/categories/accessoires")
  })
  it("emits variant hint on consolidated redirects", () => {
    const r = mapConsolidatedProductRedirect({
      legacy_slug: "jambon-orhi-demi",
      target_slug: "jambon-orhi-18-mois",
      variant_hint: "Demi",
    })
    expect(r.to_path).toContain("variant=Demi")
  })
})
