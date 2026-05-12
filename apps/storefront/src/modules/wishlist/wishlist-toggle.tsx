"use client"

import { addToWishlist, removeFromWishlist } from "@lib/data/wishlist"
import { Heart } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

const GUEST_KEY = "lehena_guest_wishlist"
const GUEST_MAX = 50

interface GuestEntry {
  product_id: string
  variant_id?: string | null
}

function readGuestList(): GuestEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as GuestEntry[]) : []
  } catch {
    return []
  }
}

function writeGuestList(list: GuestEntry[]) {
  try {
    window.localStorage.setItem(
      GUEST_KEY,
      JSON.stringify(list.slice(0, GUEST_MAX))
    )
  } catch {
    /* quota / disabled storage — silently no-op */
  }
}

interface Props {
  productId: string
  variantId?: string | null
  /** True when the server already knows this product is in the user wishlist. */
  initiallyIn?: boolean
  /** Existing wishlist item id (server-side, when known) so we can remove it. */
  itemId?: string | null
  /** True when no customer session exists — falls back to localStorage. */
  isGuest: boolean
  size?: number
  className?: string
}

/**
 * Heart toggle for product cards and PDP. Works for both authenticated
 * customers (server-side `addToWishlist` / `removeFromWishlist`) and guests
 * (localStorage list keyed by product_id|variant_id, capped at 50 entries).
 *
 * When a guest signs in, the layout's mount-time effect migrates the local
 * list into the server wishlist — see `<GuestWishlistMigrator>`.
 */
export default function WishlistToggle({
  productId,
  variantId,
  initiallyIn = false,
  itemId = null,
  isGuest,
  size = 20,
  className,
}: Props) {
  const [inList, setInList] = useState(initiallyIn)
  const [currentItemId, setCurrentItemId] = useState<string | null>(itemId)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!isGuest) return
    const guest = readGuestList()
    setInList(
      guest.some(
        (e) =>
          e.product_id === productId &&
          (e.variant_id ?? null) === (variantId ?? null)
      )
    )
  }, [isGuest, productId, variantId])

  const toggle = () => {
    if (pending) return
    startTransition(async () => {
      if (isGuest) {
        const guest = readGuestList()
        const exists = guest.some(
          (e) =>
            e.product_id === productId &&
            (e.variant_id ?? null) === (variantId ?? null)
        )
        if (exists) {
          writeGuestList(
            guest.filter(
              (e) =>
                !(
                  e.product_id === productId &&
                  (e.variant_id ?? null) === (variantId ?? null)
                )
            )
          )
          setInList(false)
        } else {
          writeGuestList([
            ...guest,
            { product_id: productId, variant_id: variantId ?? null },
          ])
          setInList(true)
        }
        return
      }
      if (inList && currentItemId) {
        const res = await removeFromWishlist(currentItemId)
        if (res.success) {
          setInList(false)
          setCurrentItemId(null)
        }
      } else {
        const res = await addToWishlist({
          product_id: productId,
          variant_id: variantId ?? null,
        })
        if (res.success || res.duplicate) setInList(true)
      }
    })
  }

  const label = inList
    ? "Retirer de la liste d'envies"
    : "Ajouter à la liste d'envies"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inList}
      aria-label={label}
      title={label}
      disabled={pending}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: 0,
        padding: 4,
        cursor: pending ? "wait" : "pointer",
        color: inList ? "var(--rouge, #b3402a)" : "var(--ink, #2a1f17)",
        transition: "color 120ms ease",
      }}
    >
      <Heart
        size={size}
        fill={inList ? "currentColor" : "none"}
        strokeWidth={inList ? 0 : 1.5}
      />
    </button>
  )
}
