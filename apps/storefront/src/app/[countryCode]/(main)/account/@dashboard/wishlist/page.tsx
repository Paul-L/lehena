import { listProducts } from "@lib/data/products"
import { listWishlist } from "@lib/data/wishlist"
import WishlistGrid from "@modules/wishlist/wishlist-grid"
import { notFound } from "next/navigation"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ma liste d'envies — Lehena",
  robots: { index: false, follow: false },
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const items = await listWishlist()
  if (items.length === 0) {
    return (
      <div className="w-full">
        <h1 className="lh-h-page mb-4">Ma liste d&apos;envies</h1>
        <p className="text-sm text-ui-fg-subtle max-w-2xl">
          Votre liste est vide. Parcourez la boutique et cliquez sur le cœur
          d&apos;un produit pour l&apos;ajouter.
        </p>
      </div>
    )
  }

  // Hydrate product data so we can display titles + prices.
  const productIds = Array.from(new Set(items.map((it) => it.product_id)))
  const { response } = await listProducts({
    pageParam: 1,
    queryParams: { id: productIds, limit: productIds.length },
    countryCode,
  })
  if (!response.products) notFound()

  return (
    <div className="w-full">
      <h1 className="lh-h-page mb-6">Ma liste d&apos;envies</h1>
      <WishlistGrid items={items} products={response.products} />
    </div>
  )
}
