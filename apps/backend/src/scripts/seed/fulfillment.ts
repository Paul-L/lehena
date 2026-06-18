import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStockLocationsWorkflow,
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

  // ─── Stock location (idempotent: create-or-update address) ─────────
  // Boutique + atelier d'affinage Lehena en Soule (Pyrénées-Atlantiques).
  const BOUTIQUE_ADDRESS = {
    address_1: "Bourg",
    city: "Laguinge",
    country_code: "fr",
    postal_code: "64470",
  } as const

  let stockLocationId: string
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Boutique Lehena" },
  })
  if (existingLocations.length > 0) {
    stockLocationId = existingLocations[0].id
    // Sync the address so the DB tracks the seed source of truth.
    await updateStockLocationsWorkflow(container).run({
      input: {
        selector: { id: stockLocationId },
        update: { name: "Boutique Lehena", address: BOUTIQUE_ADDRESS },
      },
    })
  } else {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [{ name: "Boutique Lehena", address: BOUTIQUE_ADDRESS }],
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

  // Every fulfillment provider that will back a shipping option from this
  // location must be linked here, otherwise `createShippingOptionsWorkflow`
  // rejects the option with "Providers (…) are not enabled for the service
  // location". `manual_manual` covers in-store pickup; the chronofresh /
  // colissimo providers back the calculated shipping options created below.
  const LOCATION_PROVIDERS = [
    "manual_manual",
    "chronofresh_chronofresh",
    "colissimo_colissimo",
  ] as const
  for (const fulfillment_provider_id of LOCATION_PROVIDERS) {
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_provider_id },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!/exists|duplicate|unique/i.test(msg)) {
        throw e
      }
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

  // ─── Shipping options: calculated pricing via custom providers ──────
  // Phase 5: prices now computed by the Chronofresh / Colissimo provider
  // services (grille tarifaire locale; real APIs branchées post-launch).
  // We keep one option per zone for naming clarity in the storefront, but
  // every option uses `price_type: "calculated"` so the provider is invoked
  // at checkout time.
  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id", "shipping_profile_id"],
  })
  const existingOptionNames = new Set(
    (existingOptions ?? []).map((o) => o.name)
  )
  // Shipping-profile ids that already have an in-store pickup option, so a
  // re-seed doesn't duplicate it.
  const pickupProfileIds = new Set(
    (existingOptions ?? [])
      .filter((o) => o.provider_id === "manual_manual")
      .map((o) => o.shipping_profile_id)
  )

  const calcOption = (
    name: string,
    serviceZoneId: string,
    profileId: string,
    code: "fresh" | "ambient",
    providerId: "chronofresh_chronofresh" | "colissimo_colissimo"
  ) => ({
    name,
    price_type: "calculated" as const,
    provider_id: providerId,
    service_zone_id: serviceZoneId,
    shipping_profile_id: profileId,
    type: {
      label: code === "fresh" ? "Frais (24-48h)" : "Standard (48-72h)",
      description:
        code === "fresh"
          ? "Livraison réfrigérée Chronofresh — frais offerts dès 50 €."
          : "Livraison sèche Colissimo — frais offerts dès 50 €.",
      code,
    },
    rules: [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ],
  })

  const optionsToCreate: ReturnType<typeof calcOption>[] = []
  // Mixed-cart strategy (cf. spec Phase 5 § 2.e): when the cart contains
  // both fresh and ambient items, we force the entire order into the cold
  // chain. To make that possible without changing the cart's per-profile
  // shipping method requirement, we register the Chronofresh provider as
  // *also available* on the ambient profile zones — labeled "Chronofresh
  // ambient (mixed cart)". The storefront filters these out of solo-ambient
  // carts and keeps only Chronofresh options on mixed carts.
  const toCreate: [
    string,
    string,
    "fresh" | "ambient",
    "chronofresh_chronofresh" | "colissimo_colissimo",
  ][] = [
    ["Chronofresh France", freshSet.fr.id, "fresh", "chronofresh_chronofresh"],
    ["Chronofresh Europe", freshSet.eu.id, "fresh", "chronofresh_chronofresh"],
    ["Colissimo France", ambientSet.fr.id, "ambient", "colissimo_colissimo"],
    ["Colissimo Europe", ambientSet.eu.id, "ambient", "colissimo_colissimo"],
    ["Colissimo Monde", ambientSet.world.id, "ambient", "colissimo_colissimo"],
    // Chronofresh-coverage options on the ambient profile (mixed-cart only).
    [
      "Chronofresh France (mixed)",
      ambientSet.fr.id,
      "ambient",
      "chronofresh_chronofresh",
    ],
    [
      "Chronofresh Europe (mixed)",
      ambientSet.eu.id,
      "ambient",
      "chronofresh_chronofresh",
    ],
  ]
  for (const [name, zoneId, code, providerId] of toCreate) {
    if (existingOptionNames.has(name)) continue
    const profileId = code === "fresh" ? freshProfileId : ambientProfileId
    optionsToCreate.push(calcOption(name, zoneId, profileId, code, providerId))
  }
  if (optionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: optionsToCreate,
    })
  }

  // ─── In-store pickup — "Retrait à la boutique" (Laguinge) ──────────
  // A dedicated `type: "pickup"` fulfillment set so the storefront's pickup
  // UI (which keys off `service_zone.fulfillment_set.type === "pickup"`)
  // surfaces it and — by design — bypasses the mixed-cart cold-chain filter:
  // collecting in person needs no Chronofresh. Free (flat 0 €) via the
  // already-linked `manual_manual` provider, on BOTH shipping profiles so any
  // cart — fresh (jambon) or ambient (accessoire) — can be collected.
  const PICKUP_SET_NAME = "Lehena boutique pickup"
  let pickupZoneId: string | null = null
  const { data: existingPickupSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "type", "service_zones.id"],
    filters: { name: [PICKUP_SET_NAME] },
  })
  if (existingPickupSets?.[0]?.service_zones?.[0]) {
    pickupZoneId = existingPickupSets[0].service_zones[0].id
  } else {
    const createdPickup = await fulfillment.createFulfillmentSets({
      name: PICKUP_SET_NAME,
      type: "pickup",
      service_zones: [
        {
          name: "Boutique Lehena — Laguinge",
          geo_zones: [{ type: "country", country_code: "fr" }],
        },
      ],
    })
    pickupZoneId = createdPickup.service_zones[0].id
    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
        [Modules.FULFILLMENT]: { fulfillment_set_id: createdPickup.id },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!/exists|duplicate|unique/i.test(msg)) {
        throw e
      }
    }
  }

  const pickupOptions = (["fresh", "ambient"] as ShippingProfileKind[])
    .map((k) => ({
      profileId: k === "fresh" ? freshProfileId : ambientProfileId,
    }))
    .filter(({ profileId }) => !pickupProfileIds.has(profileId))
    .map(({ profileId }) => ({
      name: "Retrait à la boutique",
      price_type: "flat" as const,
      provider_id: "manual_manual",
      service_zone_id: pickupZoneId!,
      shipping_profile_id: profileId,
      prices: [{ currency_code: "eur", amount: 0 }],
      type: {
        label: "Retrait gratuit",
        description: "Retrait à l'atelier Lehena — Bourg, 64470 Laguinge.",
        code: "pickup",
      },
      rules: [
        {
          attribute: "enabled_in_store",
          value: "true",
          operator: "eq" as const,
        },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    }))
  if (pickupOptions.length > 0) {
    await createShippingOptionsWorkflow(container).run({ input: pickupOptions })
  }

  return {
    locationId: stockLocationId,
    shippingProfiles: {
      fresh: { id: freshProfileId },
      ambient: { id: ambientProfileId },
    },
  }
}
