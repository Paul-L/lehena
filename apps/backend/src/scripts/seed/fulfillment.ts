import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

import type { MedusaContainer } from "@medusajs/framework/types"

export const SHIPPING_PROFILE_NAMES = {
  fresh: "fresh_chronofresh",
  ambient: "ambient_colissimo",
} as const
export type ShippingProfileKind = keyof typeof SHIPPING_PROFILE_NAMES

export interface SeededFulfillment {
  locationId: string
  shippingProfiles: Record<ShippingProfileKind, { id: string }>
}

const COUNTRY_GROUPS = {
  fr: ["fr"],
  eu: [
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
  ],
  world: ["gb", "ch", "no", "us", "ca", "jp", "au", "nz", "sg"],
} as const

export async function seedFulfillment(
  container: MedusaContainer,
  context: { storeId: string; defaultSalesChannelId: string }
): Promise<SeededFulfillment> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  logger.info(
    "[seed.fulfillment] Boutique Lehena location + 2 shipping profiles + stub options"
  )

  // ─── Stock location (idempotent) ──────────────────────────────────
  let stockLocationId: string
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Boutique Lehena" },
  })
  if (existingLocations.length > 0) {
    stockLocationId = existingLocations[0].id
  } else {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Boutique Lehena",
            address: {
              // ⚠️ Placeholder — replace with the real Lehena workshop
              // address before going live (cf. Phase 1 plan, sub-passe C).
              address_1: "Atelier Lehena, Pays Basque",
              city: "Pays Basque",
              country_code: "fr",
              postal_code: "64000",
            },
          },
        ],
      },
    })
    stockLocationId = result[0].id
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: context.storeId },
      update: { default_location_id: stockLocationId },
    },
  })

  // The fulfillment provider link is required so Medusa knows manual
  // fulfillments can be issued from this location.
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!/exists|duplicate|unique/i.test(msg)) {
      throw e
    }
  }

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocationId,
      add: [context.defaultSalesChannelId],
    },
  })

  // ─── Shipping profiles (fresh + ambient) ──────────────────────────
  const existingProfiles = await fulfillment.listShippingProfiles({
    name: [SHIPPING_PROFILE_NAMES.fresh, SHIPPING_PROFILE_NAMES.ambient],
  })
  const profilesByName = new Map(existingProfiles.map((p) => [p.name, p]))

  const missingProfiles = (
    ["fresh", "ambient"] as ShippingProfileKind[]
  ).filter((k) => !profilesByName.has(SHIPPING_PROFILE_NAMES[k]))
  if (missingProfiles.length > 0) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: missingProfiles.map((k) => ({
          name: SHIPPING_PROFILE_NAMES[k],
          type: "default",
        })),
      },
    })
    for (const p of result) {
      profilesByName.set(p.name, p)
    }
  }

  const freshProfileId = profilesByName.get(SHIPPING_PROFILE_NAMES.fresh)!.id
  const ambientProfileId = profilesByName.get(
    SHIPPING_PROFILE_NAMES.ambient
  )!.id

  // ─── Fulfillment sets per profile, each with FR/UE/Monde zones ────
  const { data: existingSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
    filters: {
      name: ["Lehena fresh delivery", "Lehena ambient delivery"],
    },
  })
  const setsByName = new Map(
    (existingSets ?? []).map((s) => [
      s.name as string,
      s as {
        id: string
        name: string
        service_zones: { id: string; name: string }[]
      },
    ])
  )

  async function ensureFulfillmentSet(name: string): Promise<{
    id: string
    fr: { id: string }
    eu: { id: string }
    world: { id: string }
  }> {
    let set = setsByName.get(name)
    if (!set) {
      const created = await fulfillment.createFulfillmentSets({
        name,
        type: "shipping",
        service_zones: (["fr", "eu", "world"] as const).map((zoneKey) => ({
          name: `${name} — ${zoneKey.toUpperCase()}`,
          geo_zones: COUNTRY_GROUPS[zoneKey].map((country_code) => ({
            type: "country" as const,
            country_code,
          })),
        })),
      })
      set = {
        id: created.id,
        name: created.name,
        service_zones: created.service_zones.map((z) => ({
          id: z.id,
          name: z.name,
        })),
      }
      setsByName.set(name, set)
    }
    const zoneByKey = (key: "fr" | "eu" | "world") =>
      set!.service_zones.find((z) => z.name.endsWith(key.toUpperCase()))!
    return {
      id: set.id,
      fr: { id: zoneByKey("fr").id },
      eu: { id: zoneByKey("eu").id },
      world: { id: zoneByKey("world").id },
    }
  }

  const freshSet = await ensureFulfillmentSet("Lehena fresh delivery")
  const ambientSet = await ensureFulfillmentSet("Lehena ambient delivery")

  // Link fulfillment sets to the stock location.
  for (const set of [freshSet, ambientSet]) {
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!/exists|duplicate|unique/i.test(msg)) {
        throw e
      }
    }
  }

  // ─── Stub shipping options (real Chronofresh/Colissimo prices Phase 5) ─
  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })
  const existingOptionNames = new Set(
    (existingOptions ?? []).map((o) => o.name)
  )

  const stubOption = (
    name: string,
    serviceZoneId: string,
    profileId: string,
    code: "fresh" | "ambient",
    amount: number
  ) => ({
    name,
    price_type: "flat" as const,
    provider_id: "manual_manual",
    service_zone_id: serviceZoneId,
    shipping_profile_id: profileId,
    type: {
      label: code === "fresh" ? "Frais (24-48h)" : "Standard (48-72h)",
      description:
        code === "fresh"
          ? "Livraison réfrigérée Chronofresh — stub Phase 1, tarif réel Phase 5."
          : "Livraison sèche Colissimo — stub Phase 1, tarif réel Phase 5.",
      code,
    },
    prices: [{ currency_code: "eur", amount }],
    rules: [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ],
  })

  const optionsToCreate: ReturnType<typeof stubOption>[] = []
  const toCreate: [string, string, "fresh" | "ambient", number][] = [
    ["Chronofresh France", freshSet.fr.id, "fresh", 1500],
    ["Chronofresh Europe", freshSet.eu.id, "fresh", 2900],
    ["Colissimo France", ambientSet.fr.id, "ambient", 690],
    ["Colissimo Europe", ambientSet.eu.id, "ambient", 1490],
    ["Colissimo Monde", ambientSet.world.id, "ambient", 2900],
  ]
  for (const [name, zoneId, code, amount] of toCreate) {
    if (existingOptionNames.has(name)) continue
    const profileId = code === "fresh" ? freshProfileId : ambientProfileId
    optionsToCreate.push(stubOption(name, zoneId, profileId, code, amount))
  }
  if (optionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: optionsToCreate,
    })
  }

  return {
    locationId: stockLocationId,
    shippingProfiles: {
      fresh: { id: freshProfileId },
      ambient: { id: ambientProfileId },
    },
  }
}
