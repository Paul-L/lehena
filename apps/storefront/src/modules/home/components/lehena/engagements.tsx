import { Frieze } from "@modules/common/components/lehena/primitives"

interface Pillar {
  figure: string
  unit?: string
  title: string
  detail: string
}

const PILLARS: Pillar[] = [
  {
    figure: "0",
    unit: "nitrite",
    title: "Aucun additif chimique",
    detail: "Du sel de Salies, et c'est tout.",
  },
  {
    figure: "24",
    unit: "mois",
    title: "D'affinage minimum",
    detail: "Le temps comme seul ingrédient secret.",
  },
  {
    figure: "100",
    unit: "%",
    title: "Race Duroc",
    detail: "Une race rustique, élevée en plein air au Pays Basque.",
  },
  {
    figure: "1974",
    title: "Notre première salaison",
    detail: "Quatre générations, un même geste.",
  },
  {
    figure: "64470",
    title: "Laguinge, Iparralde",
    detail: "Notre atelier en Soule, au cœur du Pays Basque français.",
  },
  {
    figure: "0",
    unit: "intermédiaire",
    title: "Vente directe",
    detail: "De notre saloir à votre table, sans détour.",
  },
]

export default function LehenaEngagements() {
  return (
    <section
      className="reveal"
      aria-labelledby="engagements-heading"
      style={{
        padding: "clamp(80px, 14vw, 140px) 0",
        background: "var(--bg-deep)",
        color: "var(--bg)",
      }}
    >
      <Frieze color="var(--rouge)" size={8} opacity={0.8} />
      <div className="lh-wrap" style={{ paddingTop: 64 }}>
        <div style={{ marginBottom: 64, maxWidth: 760 }}>
          <div
            className="eyebrow"
            style={{ color: "rgba(244, 237, 224, 0.6)", marginBottom: 14 }}
          >
            Nos engagements
          </div>
          <h2
            id="engagements-heading"
            className="serif-display"
            style={{
              fontSize: "var(--step-5)",
              lineHeight: 1,
              color: "var(--bg)",
            }}
          >
            Six choses sur lesquelles
            <br />
            <em style={{ fontStyle: "italic", color: "var(--argile)" }}>
              nous ne transigeons jamais.
            </em>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          {PILLARS.map((p, idx) => (
            <article
              key={p.title}
              style={{
                paddingTop: 32,
                paddingBottom: 8,
                borderTop: "1px solid rgba(244, 237, 224, 0.18)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                className="eyebrow"
                style={{
                  color: "rgba(244, 237, 224, 0.45)",
                  fontSize: 10,
                }}
              >
                {String(idx + 1).padStart(2, "0")} ·{" "}
                {p.title.split(" ").slice(0, 2).join(" ")}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                <span
                  className="serif-display"
                  style={{
                    fontSize: "var(--step-6)",
                    lineHeight: 0.95,
                    color: "var(--bg)",
                  }}
                >
                  {p.figure}
                </span>
                {p.unit ? (
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--argile)",
                    }}
                  >
                    {p.unit}
                  </span>
                ) : null}
              </div>
              <h3
                className="serif"
                style={{
                  fontSize: 22,
                  color: "var(--bg)",
                  fontWeight: 500,
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  color: "rgba(244, 237, 224, 0.75)",
                  lineHeight: 1.5,
                }}
              >
                {p.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
