export default function LehenaPressQuote() {
  return (
    <section
      className="reveal"
      style={{
        padding: "100px 0",
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="lh-wrap-narrow" style={{ textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 32 }}>
          Ils en parlent
        </div>
        <blockquote
          className="serif-display"
          style={{
            fontSize: "var(--step-4)",
            lineHeight: 1.15,
            marginBottom: 36,
            fontStyle: "italic",
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            margin: "0 0 36px",
          }}
        >
          « Une charcuterie qui respecte le temps, l'animal et le mangeur. Le
          jambon Orhi se goûte les yeux fermés. »
        </blockquote>
        <div className="mono" style={{ color: "var(--ink-mute)" }}>
          — Le Bon Mangeur · Mars 2025
        </div>
      </div>
    </section>
  )
}
