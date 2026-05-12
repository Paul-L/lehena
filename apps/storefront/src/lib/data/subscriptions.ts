"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"

import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"

export interface SubscriptionPlan {
  id: string
  slug: string
  name: string
  description: string | null
  price_cents: number
  frequency_days: number
  box_size: number
  hero_image_url: string | null
}

export interface Subscription {
  id: string
  customer_id: string
  plan_id: string
  status: "incomplete" | "active" | "paused" | "cancelled" | "past_due"
  stripe_subscription_id: string
  current_period_start: string | null
  current_period_end: string | null
  next_charge_at: string | null
  gift_message: string | null
}

/** Public list of active plans. */
export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const next = await getCacheOptions("subscription-plans")
  try {
    const { plans } = await sdk.client.fetch<{
      plans: SubscriptionPlan[]
    }>("/store/subscriptions", { next, cache: "force-cache" })
    return plans ?? []
  } catch {
    return []
  }
}

/** Customer's own subscriptions — requires auth. */
export async function listMySubscriptions(): Promise<Subscription[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  try {
    const { subscriptions } = await sdk.client.fetch<{
      subscriptions: Subscription[]
    }>("/store/subscriptions", { headers })
    return subscriptions ?? []
  } catch {
    return []
  }
}

export async function startSubscriptionCheckout(
  planSlug: string,
  giftMessage?: string
): Promise<{ checkout_url: string | null; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return {
      checkout_url: null,
      error: "Connectez-vous pour souscrire.",
    }
  }
  try {
    const res = await sdk.client.fetch<{
      checkout_url: string | null
      stripe_session_id: string | null
    }>("/store/subscriptions/checkout", {
      method: "POST",
      body: { plan_slug: planSlug, gift_message: giftMessage },
      headers,
    })
    return { checkout_url: res.checkout_url }
  } catch (err) {
    return {
      checkout_url: null,
      error:
        err instanceof Error
          ? err.message
          : "Impossible de démarrer le paiement.",
    }
  }
}

export async function mutateSubscription(
  id: string,
  kind: "pause" | "resume" | "cancel"
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return { success: false, error: "Non connecté." }
  }
  try {
    await sdk.client.fetch(`/store/subscriptions/${id}`, {
      method: "POST",
      body: { kind },
      headers,
    })
    const tag = await getCacheTag("subscriptions")
    revalidateTag(tag)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur.",
    }
  }
}
