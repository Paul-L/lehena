import { listProducts } from "@lib/data/products"
import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LehenaProductCard from "@modules/products/components/lehena-product-card"

/**
 * Curated "best-sellers" line-up (handles must match Phase 1 product seed).
 * Phase 10 (admin custom) will move this to a tag/collection managed in admin.
 */
const BESTSELLER_HANDLES = [
  "jambon-orhi-24-mois",
  "patxaran-traditionnel-50cl",
  "ventreche-roulee",
  "chorizo-doux",
  "piment-espelette-aop-poudre",
  "coffret-decouverte",
]

interface Props {
  countryCode: string
}

export default async function LehenaBestSellers({ countryCode }: Props) {
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      handle: BESTSELLER_HANDLES,
      limit: BESTSELLER_HANDLES.length,
      fields: "*variants.calculated_price,*categories,+thumbnail,+subtitle",
    },
  }).catch(() => ({
    response: { products: [], count: 0 },
  }))

  const products = response.products
  // Preserve the curated order from BESTSELLER_HANDLES.
  const ordered = [...products].sort(
    (a, b) =>
      BESTSELLER_HANDLES.indexOf(a.handle ?? "") -
      BESTSELLER_HANDLES.indexOf(b.handle ?? "")
  )

  if (ordered.length === 0) return null

  return (
    <section
      className="reveal"
      aria-labelledby="bestsellers-heading"
      style={{
        padding: "clamp(80px, 14vw, 140px) 0",
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            marginBottom: 56,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Les incontournables
            </div>
            <h2
              id="bestsellers-heading"
              className="serif-display"
              style={{
                fontSize: "var(--step-5)",
                lineHeight: 1,
                maxWidth: 700,
              }}
            >
              Ce qui sort de l'atelier
              <br />
              <em style={{ fontStyle: "italic" }}>en ce moment.</em>
            </h2>
            <p
              className="serif"
              style={{
                fontSize: 16,
                fontStyle: "italic",
                color: "var(--ink-mute)",
                marginTop: 16,
                maxWidth: 520,
              }}
            >
              Les pièces que nos clients reprennent à chaque commande.
            </p>
          </div>
          <LocalizedClientLink href="/store" className="btn">
            Toute la boutique <LhArrow />
          </LocalizedClientLink>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          {ordered.map((product) => (
            <LehenaProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
