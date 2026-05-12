"use client"

import { addToCart } from "@lib/data/cart"
import { Button, toast } from "@medusajs/ui"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

interface OrderItem {
  variant_id?: string | null
  quantity: number
  title: string | null
}

interface Props {
  items: OrderItem[]
  /** Optional custom label, defaults to "Recommander". */
  label?: string
  variant?: "primary" | "secondary"
  size?: "small" | "base" | "large"
}

/**
 * One-click re-order: adds every line item of the source order to the
 * current cart and redirects to /cart. Items whose variant has been deleted
 * since the original purchase are skipped with a toast warning so the
 * customer knows what got dropped.
 */
export default function ReorderButton({
  items,
  label = "Recommander",
  variant = "secondary",
  size = "base",
}: Props) {
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode ?? "fr"
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    setBusy(true)
    let added = 0
    const skipped: string[] = []
    try {
      for (const item of items) {
        if (!item.variant_id) {
          skipped.push(item.title ?? "Produit inconnu")
          continue
        }
        try {
          await addToCart({
            variantId: item.variant_id,
            quantity: item.quantity,
            countryCode,
          })
          added++
        } catch {
          skipped.push(item.title ?? "Produit inconnu")
        }
      }
      if (added > 0) {
        if (skipped.length > 0) {
          toast.warning(
            `${added} produit${added > 1 ? "s" : ""} ajouté${
              added > 1 ? "s" : ""
            }, ${skipped.length} indisponible${skipped.length > 1 ? "s" : ""} (${skipped
              .slice(0, 2)
              .join(", ")}${skipped.length > 2 ? "…" : ""})`
          )
        } else {
          toast.success(
            `${added} produit${added > 1 ? "s" : ""} ajouté${
              added > 1 ? "s" : ""
            } à votre panier`
          )
        }
        router.push(`/${countryCode}/cart`)
      } else {
        toast.error(
          "Aucun produit ne peut être recommandé — la commande est trop ancienne ou ses produits ont été retirés du catalogue."
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      isLoading={busy}
      onClick={onClick}
      data-testid="reorder-button"
    >
      {label}
    </Button>
  )
}
