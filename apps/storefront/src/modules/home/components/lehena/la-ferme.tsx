import { LhArrow } from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const STEPS: [string, string, string][] = [
  ["01", "L'élevage", "Plein air, 0,5 ha par animal"],
  ["02", "L'alimentation", "100% végétale et minérale"],
  ["03", "L'affinage", "Cave naturelle, 24 mois"],
  ["04", "La table", "Tranché sous vos yeux"],
]

export default function LehenaLaFerme() {
  return (
    <section
      className="reveal"
      style={{
        background: "var(--bg-deep)",
        color: "var(--bg)",
        padding: "140px 0",
        position: "relative",
      }}
    >
      <div className="lh-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 80,
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: "var(--argile)", marginBottom: 22 }}
            >
              De la ferme à l'assiette
            </div>
            <h2
              className="serif-display"
              style={{
                fontSize: "var(--step-6)",
                lineHeight: 0.95,
                marginBottom: 32,
                color: "var(--bg)",
              }}
            >
              Tout commence
              <br />
              dans les{" "}
              <em style={{ fontStyle: "italic", color: "var(--argile)" }}>
                collines.
              </em>
            </h2>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                lineHeight: 1.6,
                color: "rgba(244, 237, 224, 0.8)",
                maxWidth: 520,
                marginBottom: 28,
              }}
            >
              Chez nos partenaires éleveurs du Pays Basque intérieur, les porcs
              Duroc grandissent en plein air, dans une agriculture extensive qui
              respecte le rythme des saisons. Traçabilité totale, de la
              naissance à votre table.
            </p>
            <LocalizedClientLink
              href="/la-ferme"
              className="btn"
              style={{ borderColor: "var(--bg)", color: "var(--bg)" }}
            >
              Découvrir la ferme <LhArrow />
            </LocalizedClientLink>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {STEPS.map(([n, t, s]) => (
              <div
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr auto",
                  alignItems: "center",
                  gap: 20,
                  padding: "18px 0",
                  borderTop: "1px solid rgba(244, 237, 224, 0.15)",
                }}
              >
                <div
                  className="serif-display"
                  style={{
                    fontSize: 36,
                    color: "var(--argile)",
                    fontStyle: "italic",
                  }}
                >
                  {n}
                </div>
                <div>
                  <div
                    className="serif"
                    style={{ fontSize: 20, marginBottom: 2 }}
                  >
                    {t}
                  </div>
                  <div
                    style={{ fontSize: 13, color: "rgba(244, 237, 224, 0.6)" }}
                  >
                    {s}
                  </div>
                </div>
                <LhArrow />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
