import { listProducts } from "@lib/data/products"
import { listFacetedProducts } from "@lib/data/products-faceted"
import { getRegion } from "@lib/data/regions"
import { type HttpTypes } from "@medusajs/types"
import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LehenaProductCard from "@modules/products/components/lehena-product-card"

import type { EnrichedProduct } from "@lib/data/product-details"

interface Props {
  product: EnrichedProduct
  countryCode: string
}

async function fromPairingsTags(
  product: EnrichedProduct,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  const tags = product.product_details?.pairings_tags ?? []
  if (tags.length === 0) return []

  // Take up to 3 tags and run a search per tag in parallel via the faceted
  // endpoint's `q` text search. Dedupe by id, exclude the current product.
  const results = await Promise.all(
    tags.slice(0, 3).map((tag) =>
      listFacetedProducts({
        countryCode,
        q: tag,
        limit: 4,
      }).catch(() => ({ products: [], count: 0, limit: 0, offset: 0 }))
    )
  )

  const seen = new Set<string>([product.id])
  const merged: HttpTypes.StoreProduct[] = []
  for (const r of results) {
    for (const p of r.products) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      merged.push(p)
      if (merged.length >= 2) return merged
    }
  }
  return merged
}

async function fromCollectionAndTags(
  product: EnrichedProduct,
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  const region = await getRegion(countryCode)
  if (!region) return []

  const queryParams: HttpTypes.StoreProductListParams = { region_id: region.id }
  if (product.collection_id) queryParams.collection_id = [product.collection_id]
  if (product.tags?.length) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  })
    .then(({ response }) =>
      response.products.filter((p) => p.id !== product.id)
    )
    .catch(() => [])

  return products.slice(0, 2)
}

export default async function LehenaPairings({ product, countryCode }: Props) {
  // Prefer the catalog-curated pairings (Phase 1 seed: pairings_tags).
  // Fall back to the native collection+tags heuristic when none are set or
  // none resolve to other products.
  const pairings = await fromPairingsTags(product, countryCode)
  if (pairings.length < 2) {
    const fallback = await fromCollectionAndTags(product, countryCode)
    const seen = new Set(pairings.map((p) => p.id))
    for (const p of fallback) {
      if (seen.has(p.id) || pairings.length >= 2) continue
      seen.add(p.id)
      pairings.push(p)
    }
  }

  if (pairings.length === 0) return null
  const cols = Math.min(pairings.length + 1, 3)

  return (
    <section
      className="reveal"
      style={{
        padding: "100px 0",
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap">
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            marginBottom: 48,
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Accord parfait
            </div>
            <h2
              className="serif-display"
              style={{ fontSize: "var(--step-5)", lineHeight: 1 }}
            >
              Pour{" "}
              <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                aller plus loin.
              </em>
            </h2>
          </div>
          <p
            style={{
              maxWidth: 360,
              fontFamily: "var(--serif)",
              fontSize: 16,
              color: "var(--ink-soft)",
            }}
          >
            Les pièces que nos clients aiment associer à votre sélection.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 32,
          }}
        >
          {pairings.map((p) => (
            <LehenaProductCard key={p.id} product={p} />
          ))}
          <div
            style={{
              background: "var(--rouge)",
              color: "#fff",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              className="eyebrow"
              style={{ color: "rgba(255,255,255,0.7)", marginBottom: 14 }}
            >
              Trio sélection
            </div>
            <div
              className="serif-display"
              style={{ fontSize: 32, lineHeight: 1, marginBottom: 16 }}
            >
              Le coffret de l'artisan.
            </div>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 15,
                opacity: 0.9,
                marginBottom: 24,
              }}
            >
              Le produit + ses accords, dans un coffret prêt à offrir.
            </p>
            <LocalizedClientLink
              href="/categories/coffrets-cadeaux"
              className="btn"
              style={{
                borderColor: "#fff",
                color: "#fff",
                alignSelf: "flex-start",
              }}
            >
              Composer mon coffret <LhArrow />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
