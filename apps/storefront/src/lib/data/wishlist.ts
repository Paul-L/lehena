"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"

import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"

export interface WishlistItem {
  id: string
  customer_id: string
  product_id: string
  variant_id: string | null
  created_at: string
}

/**
 * Returns the current user's wishlist items. Returns an empty array when
 * unauthenticated — the storefront falls back to the localStorage wishlist
 * for guests (see `useGuestWishlist`).
 */
export async function listWishlist(): Promise<WishlistItem[]> {
  const headers = await getAuthHeaders()
  if (!headers) return []
  const next = await getCacheOptions("wishlist")
  try {
    const { items } = await sdk.client.fetch<{ items: WishlistItem[] }>(
      "/store/wishlist",
      { headers, next, cache: "force-cache" }
    )
    return items
  } catch {
    return []
  }
}

export async function addToWishlist(input: {
  product_id: string
  variant_id?: string | null
}): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return {
      success: false,
      error: "Connectez-vous pour utiliser la liste d'envies.",
    }
  }
  try {
    const res = await sdk.client.fetch<{
      item: WishlistItem | null
      duplicate?: boolean
    }>("/store/wishlist", {
      method: "POST",
      body: input,
      headers,
    })
    const tag = await getCacheTag("wishlist")
    revalidateTag(tag)
    return { success: true, duplicate: res.duplicate }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau.",
    }
  }
}

export async function removeFromWishlist(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()
  if (!headers) {
    return { success: false, error: "Non connecté." }
  }
  try {
    await sdk.client.fetch(`/store/wishlist/${itemId}`, {
      method: "DELETE",
      headers,
    })
    const tag = await getCacheTag("wishlist")
    revalidateTag(tag)
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau.",
    }
  }
}
