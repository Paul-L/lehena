import { LhArrow } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const FACTS: [string, string][] = [
  ["Race", "Duroc"],
  ["Affinage", "24 mois"],
  ["Origine", "Iparralde"],
  ["Sel", "Sel sec uniquement"],
]

export default function LehenaJambonOrhi() {
  return (
    <section
      className="reveal"
      style={{ padding: "140px 0", position: "relative", overflow: "hidden" }}
    >
      <div
        className="lh-wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            Sans nitrite · Affiné 24 mois
          </div>
          <h2
            className="serif-display"
            style={{
              fontSize: "var(--step-6)",
              lineHeight: 0.95,
              marginBottom: 28,
            }}
          >
            Le Jambon
            <br />
            <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
              Orhi.
            </em>
          </h2>
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 18,
              lineHeight: 1.6,
              marginBottom: 28,
              maxWidth: 520,
              color: "var(--ink-soft)",
            }}
          >
            Issu de porcs de race Duroc, élevés en plein air sur les collines
            d'Iparralde. La viande persillée, tendre et juteuse, dévoile au
            palais un goût caractéristique forgé par <em>vingt-quatre mois</em>{" "}
            d'affinage en cave naturelle.
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 36px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {FACTS.map(([k, v]) => (
              <li
                key={k}
                style={{
                  borderTop: "1px solid var(--line-strong)",
                  paddingTop: 10,
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 4 }}>
                  {k}
                </div>
                <div className="serif" style={{ fontSize: 18 }}>
                  {v}
                </div>
              </li>
            ))}
          </ul>
          <LocalizedClientLink
            href="/products/jambon-orhi-24-mois"
            className="btn btn-solid"
          >
            Voir le produit · 195 € <LhArrow />
          </LocalizedClientLink>
        </div>
        <div style={{ position: "relative" }}>
          <Placeholder
            label="Jambon Orhi · 24 mois"
            aspect="4/5"
            tone="rouge"
          />
          <div
            style={{
              position: "absolute",
              top: 30,
              right: -40,
              background: "var(--bg-elevated)",
              border: "1px solid var(--ink)",
              padding: "18px 22px",
              maxWidth: 220,
            }}
          >
            <div
              className="serif-display"
              style={{ fontSize: 30, lineHeight: 1 }}
            >
              24
            </div>
            <div className="eyebrow" style={{ marginTop: 4 }}>
              Mois en cave
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginTop: 8,
                fontFamily: "var(--serif)",
              }}
            >
              Brassé d'air marin et de mistral, jusqu'à atteindre une texture
              fondante.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
