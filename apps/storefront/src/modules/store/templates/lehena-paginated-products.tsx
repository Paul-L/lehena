import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import LehenaProductCard from "@modules/products/components/lehena-product-card"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type LehenaPaginatedProductsProps = {
  sortBy: SortOptions
  page: number
  view: "compact" | "comfort" | "spacious"
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}

export default async function LehenaPaginatedProducts({
  sortBy,
  page,
  view,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: LehenaPaginatedProductsProps) {
  type Query = {
    limit: number
    collection_id?: string[]
    category_id?: string[]
    id?: string[]
    order?: string
    fields?: string
  }

  const queryParams: Query = {
    limit: PRODUCT_LIMIT,
    fields:
      "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,*categories,*collection,+thumbnail,+subtitle",
  }

  if (collectionId) queryParams.collection_id = [collectionId]
  if (categoryId) queryParams.category_id = [categoryId]
  if (productsIds) queryParams.id = productsIds
  if (sortBy === "created_at") queryParams.order = "created_at"

  const region = await getRegion(countryCode)
  if (!region) return null

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const cols = view === "compact" ? 4 : view === "comfort" ? 3 : 2

  if (products.length === 0) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="serif-display" style={{ fontSize: 32, marginBottom: 8 }}>
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

      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
