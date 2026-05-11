const STEPS: [string, string, string][] = [
  ["01", "Sélection", "La meilleure pièce, choisie à la main chez l'éleveur partenaire."],
  ["02", "Salaison", "Au sel sec uniquement. Pas de saumure, pas de nitrite."],
  ["03", "Affinage", "En cave naturelle, brassée par les vents marins et continentaux."],
  ["04", "Maturation", "Le temps fait son œuvre. Plusieurs mois, parfois plusieurs années."],
]

export default function LehenaLeGeste() {
  return (
    <section
      className="reveal"
      style={{
        background: "var(--bg-deep)",
        color: "var(--bg)",
        padding: "100px 0",
      }}
    >
      <div className="lh-wrap">
        <div className="eyebrow" style={{ color: "var(--argile)", marginBottom: 24 }}>
          Le geste
        </div>
        <h2
          className="serif-display"
          style={{
            fontSize: "var(--step-5)",
            lineHeight: 0.95,
            marginBottom: 56,
            color: "var(--bg)",
            maxWidth: 800,
          }}
        >
          Quatre étapes,
          <br />
          <em style={{ fontStyle: "italic", color: "var(--argile)" }}>
            un seul savoir-faire.
          </em>
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 28,
          }}
        >
          {STEPS.map(([n, t, d]) => (
            <div key={n}>
              <div
                className="serif-display"
                style={{
                  fontSize: 56,
                  color: "var(--argile)",
                  fontStyle: "italic",
                  lineHeight: 1,
                  marginBottom: 14,
                }}
              >
                {n}
              </div>
              <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>
                {t}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(244, 237, 224, 0.7)",
                  lineHeight: 1.55,
                }}
              >
                {d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
