"use client"

import { removeFromWishlist } from "@lib/data/wishlist"
import { type HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useState, useTransition } from "react"

import type { WishlistItem } from "@lib/data/wishlist"

interface Props {
  items: WishlistItem[]
  products: HttpTypes.StoreProduct[]
}

export default function WishlistGrid({ items, products }: Props) {
  const [currentItems, setCurrentItems] = useState(items)
  const [pending, startTransition] = useTransition()

  const byProductId = new Map(products.map((p) => [p.id, p]))

  const remove = (itemId: string) => {
    startTransition(async () => {
      const res = await removeFromWishlist(itemId)
      if (res.success) {
        setCurrentItems((prev) => prev.filter((it) => it.id !== itemId))
        toast.success("Retiré de votre liste d'envies.")
      } else {
        toast.error(res.error ?? "Erreur.")
      }
    })
  }

  if (currentItems.length === 0) {
    return (
      <p className="text-sm text-ui-fg-subtle">
        Votre liste est vide. Continuez d&apos;explorer la boutique.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 small:grid-cols-3 large:grid-cols-4 gap-x-6 gap-y-10">
      {currentItems.map((item) => {
        const product = byProductId.get(item.product_id)
        if (!product) return null
        const thumb = product.thumbnail ?? product.images?.[0]?.url ?? null
        return (
          <li key={item.id} className="flex flex-col">
            <LocalizedClientLink
              href={`/products/${product.handle}`}
              className="block"
            >
              {thumb ? (
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "4 / 5" }}
                >
                  <Image
                    src={thumb}
                    alt={product.title ?? ""}
                    fill
                    sizes="(max-width: 720px) 50vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div
                  className="bg-ui-bg-subtle"
                  style={{ aspectRatio: "4 / 5" }}
                />
              )}
              <h3 className="mt-3 text-base font-medium">{product.title}</h3>
            </LocalizedClientLink>
            <div className="mt-2 flex gap-2">
              <LocalizedClientLink href={`/products/${product.handle}`}>
                <Button variant="secondary" size="small">
                  Voir
                </Button>
              </LocalizedClientLink>
              <Button
                variant="transparent"
                size="small"
                onClick={() => remove(item.id)}
                disabled={pending}
                data-testid="wishlist-remove"
              >
                Retirer
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
