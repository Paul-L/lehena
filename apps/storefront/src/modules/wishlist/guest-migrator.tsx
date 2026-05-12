"use client"

import { addToWishlist } from "@lib/data/wishlist"
import { useEffect, useRef } from "react"

const GUEST_KEY = "lehena_guest_wishlist"

interface GuestEntry {
  product_id: string
  variant_id?: string | null
}

interface Props {
  /** Rendered server-side only when a customer is logged in. */
  isAuthenticated: boolean
}

/**
 * Migrates the localStorage guest wishlist into the server wishlist exactly
 * once after login. Cleared from localStorage once successfully migrated so
 * we don't re-attempt on every render.
 *
 * Conflicts (item already present server-side) are treated as success — the
 * backend's POST /store/wishlist returns `{ duplicate: true }` for those.
 */
export default function GuestWishlistMigrator({ isAuthenticated }: Props) {
  const ran = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || ran.current) return
    ran.current = true
    let raw: string | null = null
    try {
      raw = window.localStorage.getItem(GUEST_KEY)
    } catch {
      return
    }
    if (!raw) return
    let entries: GuestEntry[]
    try {
      entries = JSON.parse(raw) as GuestEntry[]
    } catch {
      window.localStorage.removeItem(GUEST_KEY)
      return
    }
    if (entries.length === 0) {
      window.localStorage.removeItem(GUEST_KEY)
      return
    }
    ;(async () => {
      for (const e of entries) {
        await addToWishlist({
          product_id: e.product_id,
          variant_id: e.variant_id ?? null,
        })
      }
      try {
        window.localStorage.removeItem(GUEST_KEY)
      } catch {
        /* ignore */
      }
    })()
  }, [isAuthenticated])

  return null
}
