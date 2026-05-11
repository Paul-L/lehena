import { NewsletterForm } from "@modules/layout/components/newsletter-form"

export default function LehenaNewsletterHome() {
  return (
    <section
      className="reveal"
      aria-labelledby="newsletter-home-heading"
      style={{
        padding: "clamp(80px, 14vw, 120px) 0",
        background: "var(--paper)",
      }}
    >
      <div
        className="lh-wrap-narrow"
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
        }}
      >
        <span className="eyebrow" style={{ color: "var(--rouge)" }}>
          Lettre saisonnière
        </span>
        <h2
          id="newsletter-home-heading"
          className="serif-display"
          style={{
            fontSize: "var(--step-5)",
            lineHeight: 1,
            maxWidth: 720,
          }}
        >
          Recevez les nouveautés
          <br />
          <em style={{ fontStyle: "italic", color: "var(--rouge-deep)" }}>
            du saloir.
          </em>
        </h2>
        <p
          className="serif"
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--ink-soft)",
            lineHeight: 1.55,
            maxWidth: 560,
          }}
        >
          Recettes basques, ouvertures de cave, nouveaux affinages. Une lettre
          par mois, jamais plus. Pas de spam, pas de promo agressive.
        </p>
        <div style={{ width: "100%", maxWidth: 460, marginTop: 12 }}>
          <NewsletterForm source="home" tone="light" />
        </div>
      </div>
    </section>
  )
}
