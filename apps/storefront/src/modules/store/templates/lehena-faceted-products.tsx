import { listFacetedProducts } from "@lib/data/products-faceted"
import { LehenaPagination } from "@modules/common/components/lehena/pagination"
import LehenaProductCard from "@modules/products/components/lehena-product-card"

import type { FacetParams } from "@lib/data/products-faceted"

interface LehenaFacetedProductsProps {
  facets: FacetParams
  view: "compact" | "comfort" | "spacious"
  limit?: number
}

const PRODUCT_LIMIT = 12

export default async function LehenaFacetedProducts({
  facets,
  view,
  limit = PRODUCT_LIMIT,
}: LehenaFacetedProductsProps) {
  const { products, count } = await listFacetedProducts({
    ...facets,
    limit,
  })

  const totalPages = Math.ceil(count / limit)
  const page = facets.page ?? 1
  const cols = view === "compact" ? 4 : view === "comfort" ? 3 : 2

  if (products.length === 0) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <div
          className="serif-display"
          style={{ fontSize: 32, marginBottom: 8 }}
        >
          Rien à cette adresse.
        </div>
        <p style={{ color: "var(--ink-mute)", marginBottom: 20 }}>
          Essayez d'élargir vos filtres.
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        className="boutique-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 32,
          rowGap: 56,
        }}
        data-testid="products-list"
      >
        {products.map((p) => (
          <LehenaProductCard key={p.id} product={p} size={view} />
        ))}
      </div>

      <div
        style={{
          marginTop: 64,
          padding: "32px 0",
          borderTop: "1px solid var(--line)",
          textAlign: "center",
        }}
      >
        <div className="eyebrow" style={{ color: "var(--ink-mute)" }}>
          {count} référence{count > 1 ? "s" : ""}
        </div>
      </div>

      {totalPages > 1 ? (
        <div style={{ marginTop: 24 }}>
          <LehenaPagination page={page} totalPages={totalPages} />
        </div>
      ) : null}
    </>
  )
}

export { type LehenaFacetedProductsProps }
