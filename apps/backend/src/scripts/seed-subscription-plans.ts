import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  SUBSCRIPTION_MODULE,
  type SubscriptionModuleService,
} from "../modules/subscription"

import type { ExecArgs } from "@medusajs/framework/types"

interface Seed {
  slug: string
  name: string
  description: string
  price_cents: number
  box_size: number
  frequency_days: number
  stripe_price_env_key: string
  hero_image_url: string | null
}

const SEEDS: Seed[] = [
  {
    slug: "decouverte",
    name: "Découverte",
    description:
      "Trois pièces choisies chaque mois par l'atelier — pour découvrir notre univers à un rythme tranquille.",
    price_cents: 4900,
    box_size: 3,
    frequency_days: 30,
    stripe_price_env_key: "STRIPE_PRICE_SUBSCRIPTION_DECOUVERTE",
    hero_image_url: null,
  },
  {
    slug: "gourmet",
    name: "Gourmet",
    description:
      "Cinq pièces sélectionnées chaque mois — la box qui fait la différence sur la table du dimanche.",
    price_cents: 7900,
    box_size: 5,
    frequency_days: 30,
    stripe_price_env_key: "STRIPE_PRICE_SUBSCRIPTION_GOURMET",
    hero_image_url: null,
  },
]

/**
 * Idempotent seed for the two V1 subscription plans. Re-running keeps
 * the row id stable so storefront URLs and Stripe configurations don't
 * drift.
 */
export default async function seedSubscriptionPlans({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service =
    container.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)

  for (const seed of SEEDS) {
    const existing = await service.listSubscriptionPlans({ slug: seed.slug })
    if (existing.length > 0) {
      await service.updateSubscriptionPlans({
        id: existing[0].id,
        name: seed.name,
        description: seed.description,
        price_cents: seed.price_cents,
        box_size: seed.box_size,
        frequency_days: seed.frequency_days,
        stripe_price_env_key: seed.stripe_price_env_key,
        hero_image_url: seed.hero_image_url,
      })
      logger.info(`[seed-subscription-plans] updated ${seed.slug}`)
    } else {
      await service.createSubscriptionPlans({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        price_cents: seed.price_cents,
        box_size: seed.box_size,
        frequency_days: seed.frequency_days,
        stripe_price_env_key: seed.stripe_price_env_key,
        hero_image_url: seed.hero_image_url,
        active: true,
      })
      logger.info(`[seed-subscription-plans] created ${seed.slug}`)
    }
  }
}
