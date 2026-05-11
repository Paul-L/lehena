import { LhArrow } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Carte / Où nous trouver" section — drives local SEO + atelier teaser.
 * V1 uses a Placeholder; real photo to be uploaded before bascule (Phase 14).
 */
export default function LehenaNotreAtelier() {
  return (
    <section
      className="reveal"
      aria-labelledby="atelier-heading"
      style={{
        padding: "clamp(80px, 14vw, 140px) 0",
        background: "var(--bg)",
      }}
    >
      <div className="lh-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 72,
            alignItems: "center",
          }}
        >
          {/* Visuel atelier + carte minimaliste */}
          <div style={{ position: "relative" }}>
            <Placeholder
              label="Atelier Lehena · Laguinge"
              aspect="5/4"
              tone="argile"
            />
            {/* Mini-carte SVG : silhouette Pyrénées-Atlantiques avec point Lehena */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: -32,
                right: -32,
                width: 220,
                height: 160,
                background: "var(--bg-elevated)",
                border: "1px solid var(--line-strong)",
                boxShadow: "0 12px 36px -16px rgba(0,0,0,0.18)",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 10, color: "var(--ink-mute)" }}
              >
                64° N — 1° O
              </div>
              <svg
                viewBox="0 0 220 100"
                style={{ width: "100%", height: 80 }}
                role="img"
                aria-label="Carte du Pays Basque français"
              >
                <path
                  d="M10 60 Q 40 30 70 45 T 130 50 Q 170 35 200 50 L 200 80 L 10 80 Z"
                  fill="var(--paper)"
                  stroke="var(--ink-soft)"
                  strokeWidth="1"
                />
                <circle cx="78" cy="58" r="5" fill="var(--rouge)" />
                <text
                  x="86"
                  y="61"
                  fontFamily="var(--mono)"
                  fontSize="9"
                  fill="var(--ink)"
                >
                  Laguinge
                </text>
              </svg>
            </div>
          </div>

          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 14, color: "var(--rouge)" }}
            >
              Notre atelier
            </div>
            <h2
              id="atelier-heading"
              className="serif-display"
              style={{
                fontSize: "var(--step-5)",
                lineHeight: 1,
                marginBottom: 24,
              }}
            >
              Bourg, 64470 Laguinge.
              <br />
              <em style={{ fontStyle: "italic", color: "var(--argile)" }}>
                Soule — Pays Basque.
              </em>
            </h2>
            <p
              className="serif"
              style={{
                fontSize: 17,
                fontStyle: "italic",
                color: "var(--ink-soft)",
                lineHeight: 1.6,
                marginBottom: 18,
                maxWidth: 460,
              }}
            >
              Notre atelier d'affinage est niché dans un hameau de Soule, à
              mi-chemin entre les pâturages d'Iparralde et l'océan. C'est ici
              que nos jambons mûrissent à l'air des montagnes, parfois jusqu'à
              trente mois.
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--ink-mute)",
                marginBottom: 28,
                lineHeight: 1.6,
                maxWidth: 460,
              }}
            >
              Vous pouvez nous rendre visite sur rendez-vous, le samedi en
              matinée.
            </p>
            <LocalizedClientLink href="/atelier" className="btn">
              Découvrir l'atelier <LhArrow />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
