import { listProductReviews } from "@lib/data/reviews"
import { LhSparkle } from "@modules/common/components/lehena/icons"

import LehenaReviewForm from "./reviews-form"

interface Props {
  productId: string
  /** True when the visitor is logged in — drives the inline form vs CTA. */
  isCustomer: boolean
}

const EMPTY_COPY = {
  title: "Soyez le premier à donner votre avis.",
  body: "Aucun avis publié pour ce produit. Vos retours après dégustation aident toute la communauté.",
}

/**
 * Server component. Fetches approved reviews via the backend
 * `/store/products/:id/reviews` endpoint and renders them under the PDP.
 * Aggregate (average, count) is computed server-side over the full set —
 * not paginated — and surfaced via the PDP's JSON-LD AggregateRating in
 * the parent template.
 */
export default async function LehenaReviews({ productId, isCustomer }: Props) {
  const { reviews, aggregate } = await listProductReviews(productId, {
    limit: 6,
  })

  const ratingLabel = aggregate.average
    ? aggregate.average.toFixed(1).replace(".", ",")
    : null
  const ratingStars = Math.round(aggregate.average ?? 0)

  return (
    <section className="reveal" style={{ padding: "100px 0" }}>
      <div className="lh-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 60,
            alignItems: "start",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Avis dégustateurs
            </div>
            {aggregate.count > 0 && ratingLabel ? (
              <h2
                className="serif-display"
                style={{
                  fontSize: "var(--step-4)",
                  lineHeight: 1,
                  marginBottom: 24,
                }}
              >
                <em style={{ fontStyle: "italic" }}>{ratingLabel}</em>/5
                <br />
                sur {aggregate.count} avis
              </h2>
            ) : (
              <h2
                className="serif-display"
                style={{
                  fontSize: "var(--step-4)",
                  lineHeight: 1.05,
                  marginBottom: 24,
                }}
              >
                {EMPTY_COPY.title}
              </h2>
            )}
            {aggregate.count > 0 ? (
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    style={{
                      color:
                        i <= ratingStars ? "var(--rouge)" : "var(--ink-mute)",
                      display: "inline-flex",
                    }}
                  >
                    <LhSparkle size={16} />
                  </span>
                ))}
              </div>
            ) : null}
            <LehenaReviewForm productId={productId} isCustomer={isCustomer} />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {reviews.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "var(--ink-soft)",
                }}
              >
                {EMPTY_COPY.body}
              </p>
            ) : (
              reviews.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    paddingBottom: 24,
                    borderBottom:
                      i < reviews.length - 1 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      className="serif"
                      style={{ fontSize: 17, fontWeight: 500 }}
                    >
                      {r.customer_name ?? "Client Lehena"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        color: "var(--rouge)",
                      }}
                    >
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <LhSparkle key={j} size={12} />
                      ))}
                    </div>
                  </div>
                  {r.approved_at ? (
                    <div
                      className="mono"
                      style={{
                        color: "var(--ink-mute)",
                        fontSize: 11,
                        marginBottom: 10,
                      }}
                    >
                      {new Date(r.approved_at).toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  ) : null}
                  {r.title ? (
                    <p
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 17,
                        marginBottom: 6,
                      }}
                    >
                      {r.title}
                    </p>
                  ) : null}
                  <p
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 16,
                      lineHeight: 1.55,
                      color: "var(--ink-soft)",
                      fontStyle: "italic",
                    }}
                  >
                    « {r.body} »
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
