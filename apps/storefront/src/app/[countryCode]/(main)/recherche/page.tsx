import { searchProducts } from "@lib/data/search"
import { buildMetadata } from "@lib/seo/metadata"
import { LhArrow, LhSearch } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { Metadata } from "next"

export const metadata: Metadata = buildMetadata({
  title: "Recherche",
  description:
    "Trouvez votre prochain jambon affiné, salaison, patxaran ou coffret cadeau dans toute la maison Lehena.",
  // /recherche pages are noindex per strategie-seo.md — every query
  // produces a different URL.
  noindex: true,
})

const TONES = ["rouge", "kraft", "encre", "argile", "olive", "creme"] as const

interface Props {
  searchParams: Promise<{ q?: string }>
  params: Promise<{ countryCode: string }>
}

export default async function SearchPage(props: Props) {
  const { q = "" } = await props.searchParams
  const { countryCode } = await props.params
  const query = q.trim()

  const { hits, estimatedTotalHits, processingTimeMs } = await searchProducts(
    query,
    { limit: 36 }
  )

  return (
    <main className="lh-wrap" style={{ padding: "60px 0 120px" }}>
      <section style={{ marginBottom: 56 }}>
        <div
          className="eyebrow"
          style={{ color: "var(--rouge)", marginBottom: 16 }}
        >
          Recherche
        </div>
        <form
          method="get"
          action={`/${countryCode}/recherche`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingBottom: 18,
            borderBottom: "1px solid var(--line-strong)",
          }}
        >
          <LhSearch size={22} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Jambon Orhi, patxaran, axoa…"
            aria-label="Recherche"
            style={{
              flex: 1,
              border: 0,
              background: "transparent",
              fontFamily: "var(--serif-display)",
              fontSize: "clamp(28px, 5vw, 44px)",
              outline: "none",
              color: "var(--ink)",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            className="btn btn-rouge"
            style={{ flexShrink: 0 }}
          >
            Chercher
          </button>
        </form>
        {query ? (
          <div
            className="mono"
            style={{
              marginTop: 18,
              fontSize: 11,
              color: "var(--ink-mute)",
              letterSpacing: "0.1em",
            }}
          >
            {estimatedTotalHits} résultat{estimatedTotalHits > 1 ? "s" : ""}{" "}
            pour <span style={{ color: "var(--ink)" }}>« {query} »</span>
            {processingTimeMs > 0 ? ` · ${processingTimeMs} ms` : ""}
          </div>
        ) : (
          <p
            className="serif"
            style={{
              fontStyle: "italic",
              color: "var(--ink-soft)",
              marginTop: 18,
              fontSize: 16,
            }}
          >
            Tapez un mot — un produit, un terroir, une recette.
          </p>
        )}
      </section>

      {query && hits.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div
            className="serif-display"
            style={{ fontSize: 32, marginBottom: 8 }}
          >
            Rien ne sort de la cave.
          </div>
          <p style={{ color: "var(--ink-mute)", marginBottom: 28 }}>
            Essayez « jambon », « patxaran », « coffret », ou parcourez toute la
            maison.
          </p>
          <LocalizedClientLink href="/store" className="btn btn-rouge">
            Voir toute la boutique <LhArrow />
          </LocalizedClientLink>
        </div>
      ) : null}

      {hits.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            rowGap: 56,
          }}
        >
          {hits.map((hit, idx) => {
            const tone = TONES[idx % TONES.length]
            return (
              <article
                key={hit.id}
                style={{ position: "relative" }}
                data-testid="search-result"
              >
                <LocalizedClientLink
                  href={`/products/${hit.handle}`}
                  style={{ display: "block" }}
                >
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      marginBottom: 16,
                      background: "var(--paper)",
                      aspectRatio: "4 / 5",
                    }}
                  >
                    {hit.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hit.thumbnail}
                        alt={hit.title}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Placeholder label={hit.title} aspect="4/5" tone={tone} />
                    )}
                    {hit.categories?.[0]?.name ? (
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                        }}
                      >
                        <span
                          className="chip chip-solid"
                          style={{ fontSize: 9 }}
                        >
                          {hit.categories[0].name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <h2
                    className="serif-display"
                    style={{ fontSize: 22, marginBottom: 4, lineHeight: 1.1 }}
                  >
                    {hit.title}
                  </h2>
                  {hit.subtitle ? (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--ink-mute)",
                        marginBottom: 0,
                      }}
                    >
                      {hit.subtitle}
                    </p>
                  ) : null}
                </LocalizedClientLink>
              </article>
            )
          })}
        </div>
      ) : null}
    </main>
  )
}
