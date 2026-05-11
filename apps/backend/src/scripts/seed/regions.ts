import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createTaxRatesWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

import type { MedusaContainer } from "@medusajs/framework/types"

// Country lists per region. Storefront middleware picks the right region
// from the visitor's countryCode segment.
const FR_COUNTRIES = ["fr"]
const EU_COUNTRIES = [
  "de",
  "es",
  "it",
  "be",
  "nl",
  "lu",
  "pt",
  "at",
  "ie",
  "fi",
  "se",
  "dk",
  "gr",
  "pl",
  "cz",
  "ee",
  "hu",
  "ro",
  "sk",
  "si",
  "lt",
  "lv",
  "bg",
  "hr",
  "mt",
  "cy",
]
// "Monde" = countries we ship to outside the EU + UK + Switzerland +
// Norway. Restrict here to avoid the storefront prompting for any country
// in the world.
const WORLD_COUNTRIES = ["gb", "ch", "no", "us", "ca", "jp", "au", "nz", "sg"]

export const REGION_NAMES = {
  fr: "France",
  eu: "Union Européenne",
  world: "Monde",
} as const

export const PRODUCT_TYPE_VALUES = {
  alimentaire: "alimentaire",
  accessoire: "accessoire",
} as const
export type ProductTypeValue =
  (typeof PRODUCT_TYPE_VALUES)[keyof typeof PRODUCT_TYPE_VALUES]

export interface SeededRegions {
  fr: { id: string }
  eu: { id: string }
  world: { id: string }
  productTypeIds: Record<ProductTypeValue, string>
}

export async function seedRegions(
  container: MedusaContainer
): Promise<SeededRegions> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService = container.resolve(Modules.PRODUCT)

  logger.info("[seed.regions] 3 regions + product types + differentiated VAT")

  // ─── Product types (alimentaire / accessoire) ──────────────────────
  const wantedValues: ProductTypeValue[] = [
    PRODUCT_TYPE_VALUES.alimentaire,
    PRODUCT_TYPE_VALUES.accessoire,
  ]
  const allTypes = await productModuleService.listProductTypes()
  const typesByValue = new Map(
    allTypes
      .filter((t) => wantedValues.includes(t.value as ProductTypeValue))
      .map((t) => [t.value, t])
  )

  const toCreate = (
    [
      PRODUCT_TYPE_VALUES.alimentaire,
      PRODUCT_TYPE_VALUES.accessoire,
    ] as ProductTypeValue[]
  ).filter((v) => !typesByValue.has(v))
  if (toCreate.length > 0) {
    const created = await productModuleService.createProductTypes(
      toCreate.map((value) => ({ value }))
    )
    for (const t of created) {
      typesByValue.set(t.value, t)
    }
  }

  const productTypeIds: Record<ProductTypeValue, string> = {
    alimentaire: typesByValue.get(PRODUCT_TYPE_VALUES.alimentaire)!.id,
    accessoire: typesByValue.get(PRODUCT_TYPE_VALUES.accessoire)!.id,
  }

  // ─── Regions (idempotent: reuse if same name) ──────────────────────
  // Cleanup: the Medusa starter demo seed creates a single "Europe" region
  // that holds FR/DE/IT/etc., which prevents our 3-region Lehena setup
  // (countries can only belong to one region). Remove it if present.
  const regionModuleService = container.resolve(Modules.REGION)
  const legacyRegions = await regionModuleService.listRegions({
    name: "Europe",
  })
  if (legacyRegions.length > 0) {
    logger.info("[seed.regions] removing legacy 'Europe' demo region")
    await regionModuleService.deleteRegions(legacyRegions.map((r) => r.id))
  }

  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  })
  const existingByName = new Map(
    (existingRegions ?? []).map((r) => [r.name, r])
  )

  const regionsToCreate: {
    key: keyof typeof REGION_NAMES
    payload: Parameters<typeof createRegionsWorkflow>[0] extends never
      ? never
      : {
          name: string
          currency_code: string
          countries: string[]
          payment_providers: string[]
        }
  }[] = [
    {
      key: "fr",
      payload: {
        name: REGION_NAMES.fr,
        currency_code: "eur",
        countries: FR_COUNTRIES,
        payment_providers: ["pp_system_default"],
      },
    },
    {
      key: "eu",
      payload: {
        name: REGION_NAMES.eu,
        currency_code: "eur",
        countries: EU_COUNTRIES,
        payment_providers: ["pp_system_default"],
      },
    },
    {
      key: "world",
      payload: {
        name: REGION_NAMES.world,
        currency_code: "eur",
        countries: WORLD_COUNTRIES,
        payment_providers: ["pp_system_default"],
      },
    },
  ]

  const missing = regionsToCreate.filter(
    (r) => !existingByName.has(r.payload.name)
  )
  if (missing.length > 0) {
    await createRegionsWorkflow(container).run({
      input: { regions: missing.map((m) => m.payload) },
    })
  }

  const { data: refreshedRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  })
  const byName = new Map(refreshedRegions.map((r) => [r.name, r]))
  const fr = byName.get(REGION_NAMES.fr)
  const eu = byName.get(REGION_NAMES.eu)
  const world = byName.get(REGION_NAMES.world)
  if (!fr || !eu || !world) {
    throw new Error("[seed.regions] region creation failed")
  }

  // ─── Tax regions per country (idempotent: skip existing) ───────────
  const allCountryCodes = [...FR_COUNTRIES, ...EU_COUNTRIES, ...WORLD_COUNTRIES]
  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  const existingTaxCountries = new Set(
    (existingTaxRegions ?? []).map((r) => r.country_code)
  )
  const missingTax = allCountryCodes.filter((c) => !existingTaxCountries.has(c))
  if (missingTax.length > 0) {
    await createTaxRegionsWorkflow(container).run({
      input: missingTax.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    })
  }

  // ─── FR differentiated tax rates by product_type ───────────────────
  const { data: frTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
    filters: { country_code: "fr" },
  })
  const frTaxRegionId = frTaxRegions?.[0]?.id
  if (!frTaxRegionId) {
    throw new Error("[seed.regions] FR tax region missing after creation")
  }

  // Read existing FR tax rates to avoid duplicates on re-seed.
  const { data: existingFrRates } = await query.graph({
    entity: "tax_rate",
    fields: ["id", "code", "rate"],
    filters: { tax_region_id: frTaxRegionId },
  })
  const existingCodes = new Set(
    (existingFrRates ?? []).map((r) => r.code).filter(Boolean)
  )

  const ratesPayload: {
    code: string
    name: string
    rate: number
    tax_region_id: string
    is_default?: boolean
    rules: { reference: "product_type"; reference_id: string }[]
  }[] = []
  if (!existingCodes.has("FR-ALIM")) {
    ratesPayload.push({
      code: "FR-ALIM",
      name: "TVA alimentaire 5,5 %",
      rate: 5.5,
      tax_region_id: frTaxRegionId,
      rules: [
        {
          reference: "product_type",
          reference_id: productTypeIds.alimentaire,
        },
      ],
    })
  }
  if (!existingCodes.has("FR-ACC")) {
    ratesPayload.push({
      code: "FR-ACC",
      name: "TVA accessoire 20 %",
      rate: 20,
      tax_region_id: frTaxRegionId,
      rules: [
        {
          reference: "product_type",
          reference_id: productTypeIds.accessoire,
        },
      ],
    })
  }
  if (ratesPayload.length > 0) {
    await createTaxRatesWorkflow(container).run({ input: ratesPayload })
  }

  return {
    fr: { id: fr.id },
    eu: { id: eu.id },
    world: { id: world.id },
    productTypeIds,
  }
}
