import { listProducts } from "@lib/data/products"
import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LehenaProductCard from "@modules/products/components/lehena-product-card"

const COFFRET_HANDLES = [
  "coffret-decouverte",
  "coffret-tradition",
  "coffret-prestige",
]

interface Props {
  countryCode: string
}

export default async function LehenaCoffrets({ countryCode }: Props) {
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      handle: COFFRET_HANDLES,
      limit: COFFRET_HANDLES.length,
      fields: "*variants.calculated_price,*categories,+thumbnail,+subtitle",
    },
  }).catch(() => ({ response: { products: [], count: 0 } }))

  const ordered = [...response.products].sort(
    (a, b) =>
      COFFRET_HANDLES.indexOf(a.handle ?? "") -
      COFFRET_HANDLES.indexOf(b.handle ?? "")
  )

  if (ordered.length === 0) return null

  return (
    <section
      className="reveal"
      aria-labelledby="coffrets-heading"
      style={{
        padding: "clamp(80px, 14vw, 140px) 0",
        background: "var(--paper)",
      }}
    >
      <div className="lh-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 64,
            alignItems: "center",
            marginBottom: 56,
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 14, color: "var(--rouge)" }}
            >
              Coffrets &amp; cadeaux
            </div>
            <h2
              id="coffrets-heading"
              className="serif-display"
              style={{
                fontSize: "var(--step-5)",
                lineHeight: 1,
              }}
            >
              Un Pays Basque
              <br />
              <em style={{ fontStyle: "italic", color: "var(--rouge-deep)" }}>
                à offrir.
              </em>
            </h2>
          </div>
          <p
            className="serif"
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "var(--ink-soft)",
              lineHeight: 1.55,
              maxWidth: 580,
            }}
          >
            Trois compositions pensées pour découvrir l'atelier, prolonger une
            tablée, ou marquer un événement. Emballage soigné dans nos boîtes
            kraft, mot personnalisable à la commande.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 36,
            marginBottom: 48,
          }}
        >
          {ordered.map((product) => (
            <LehenaProductCard
              key={product.id}
              product={product}
              size="spacious"
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <LocalizedClientLink
            href="/categories/coffrets-cadeaux"
            className="btn btn-solid"
          >
            Voir tous les coffrets <LhArrow />
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
