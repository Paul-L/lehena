import {
  LhArrow,
  LhAward,
  LhLeaf,
  LhSparkle,
  LhTruck,
} from "@modules/common/components/lehena/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const TRUST = [
  {
    Icon: LhTruck,
    label: "Livraison Chronofresh",
    sub: "24–48h en France",
  },
  {
    Icon: LhAward,
    label: "Maître artisan",
    sub: "Affinage minimum 15 mois",
  },
  {
    Icon: LhLeaf,
    label: "Sans nitrite",
    sub: "Sel sec et temps long",
  },
  {
    Icon: LhSparkle,
    label: "Frais de port offerts",
    sub: "Dès 50 € d'achat",
  },
]

export default function LehenaHero() {
  return (
    <section
      style={{ position: "relative", overflow: "hidden", paddingBottom: 0 }}
    >
      <div className="lh-wrap" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          <div>
            <div
              className="eyebrow reveal"
              style={{
                marginBottom: 28,
                display: "flex",
                gap: 14,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 36,
                  height: 1,
                  background: "var(--ink)",
                }}
              />
              Sublimateur de saveurs · Depuis 1974
            </div>
            <h1
              className="serif-display reveal"
              style={{
                fontSize: "var(--step-7)",
                lineHeight: 0.92,
                marginBottom: 32,
                letterSpacing: "-0.025em",
              }}
            >
              Le goût
              <br />
              <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
                de la patience.
              </em>
            </h1>
            <p
              className="reveal"
              style={{
                fontSize: 18,
                color: "var(--ink-soft)",
                maxWidth: 480,
                marginBottom: 36,
                lineHeight: 1.5,
                fontFamily: "var(--serif)",
              }}
            >
              Maître artisan charcutier au Pays Basque. Jambons affinés{" "}
              <em>vingt-quatre mois</em>, salaisons sans nitrite, recettes du
              Sud-Ouest. Le sel, le temps, et rien d'autre.
            </p>
            <div
              className="reveal"
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <LocalizedClientLink href="/store" className="btn btn-rouge">
                Découvrir nos produits <LhArrow />
              </LocalizedClientLink>
              <LocalizedClientLink href="/histoire" className="btn btn-ghost">
                Notre histoire
              </LocalizedClientLink>
            </div>
          </div>

          <div
            className="reveal"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 600,
            }}
          >
            <Image
              src="/images/hero-jambon-cutout.webp"
              alt="Jambon Orhi entier de la Maison Lehena sur son porte-jambon, affiné 24 mois sans nitrite"
              width={1100}
              height={816}
              priority
              sizes="(max-width: 768px) 92vw, 46vw"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 34px 42px rgba(28,20,16,0.24))",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: -10,
                background: "var(--rouge)",
                color: "#fff",
                padding: "16px 22px",
                borderRadius: "50%",
                width: 110,
                height: 110,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                transform: "rotate(-8deg)",
              }}
            >
              <div
                className="serif-display"
                style={{ fontSize: 32, lineHeight: 1 }}
              >
                24
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.1em",
                }}
              >
                MOIS
                <br />
                D'AFFINAGE
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
          background: "var(--bg-elevated)",
        }}
      >
        <div
          className="lh-wrap"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            padding: "24px 0",
            gap: 24,
          }}
        >
          {TRUST.map(({ Icon, label, sub }) => (
            <div
              key={label}
              style={{ display: "flex", gap: 14, alignItems: "center" }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--bg)",
                  border: "1px solid var(--line-strong)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
