import { LhSparkle } from "@modules/common/components/lehena/icons"

const REVIEWS = [
  {
    who: "Marie L. · Bordeaux",
    date: "Mars 2026",
    note:
      "Le goût d'un autre temps. Le jambon fond, la coupe est précise, et l'odeur de cave est incomparable. Je commande chaque trimestre.",
    stars: 5,
  },
  {
    who: "Antoine R. · Paris",
    date: "Février 2026",
    note:
      "Très belle découverte. La pièce est arrivée parfaitement emballée, fraîche, et la qualité est au rendez-vous. Bravo aux artisans.",
    stars: 5,
  },
  {
    who: "Élodie T. · Lyon",
    date: "Janvier 2026",
    note:
      "On retrouve enfin un vrai jambon, sans additif, avec un caractère affirmé. Le prix est juste pour la qualité reçue.",
    stars: 5,
  },
]

export default function LehenaReviews() {
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
            <h2
              className="serif-display"
              style={{
                fontSize: "var(--step-4)",
                lineHeight: 1,
                marginBottom: 24,
              }}
            >
              <em style={{ fontStyle: "italic" }}>4,9</em>/5
              <br />
              sur 248 avis
            </h2>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <LhSparkle key={i} size={16} />
              ))}
            </div>
            <button type="button" className="btn">
              Laisser un avis
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {REVIEWS.map((r, i) => (
              <div
                key={i}
                style={{
                  paddingBottom: 24,
                  borderBottom: i < REVIEWS.length - 1 ? "1px solid var(--line)" : "none",
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
                  <div className="serif" style={{ fontSize: 17, fontWeight: 500 }}>
                    {r.who}
                  </div>
                  <div style={{ display: "flex", gap: 2, color: "var(--rouge)" }}>
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <LhSparkle key={j} size={12} />
                    ))}
                  </div>
                </div>
                <div
                  className="mono"
                  style={{ color: "var(--ink-mute)", fontSize: 11, marginBottom: 10 }}
                >
                  {r.date}
                </div>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    lineHeight: 1.55,
                    color: "var(--ink-soft)",
                    fontStyle: "italic",
                  }}
                >
                  « {r.note} »
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
