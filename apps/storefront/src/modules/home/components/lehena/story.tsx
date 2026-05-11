import { LhArrow } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function LehenaStory() {
  return (
    <section className="reveal" style={{ padding: "120px 0" }}>
      <div
        className="lh-wrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <Placeholder label="L'artisan · Atelier" aspect="3/4" tone="encre" />
          <div
            style={{
              position: "absolute",
              bottom: -24,
              left: -24,
              right: 80,
              background: "var(--bg-elevated)",
              border: "1px solid var(--line-strong)",
              padding: "20px 24px",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Cinquante ans plus tard
            </div>
            <div
              className="serif-display"
              style={{ fontSize: 22, lineHeight: 1.15 }}
            >
              « Toujours les mêmes gestes, toujours le même temps. »
            </div>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            Notre maison
          </div>
          <h2
            className="serif-display"
            style={{
              fontSize: "var(--step-6)",
              lineHeight: 0.95,
              marginBottom: 32,
            }}
          >
            Une histoire
            <br />
            de{" "}
            <em style={{ fontStyle: "italic", color: "var(--rouge)" }}>
              passion
            </em>
            ,
            <br />
            de gestes
            <br />
            et de patience.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 36,
              marginBottom: 36,
            }}
          >
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
              }}
            >
              Lehena, c'est l'histoire d'une passion qui nous anime depuis
              cinquante ans. L'envie de vous faire découvrir des produits
              d'exception au goût incomparable du terroir du Sud-Ouest.
            </p>
            <p
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
              }}
            >
              C'est aussi une prise de conscience : revenir à un mode de
              consommation équilibré, alerter sur la nécessité du bien-manger,
              dans le respect du bien-être animal et de l'environnement.
            </p>
          </div>
          <LocalizedClientLink href="/histoire" className="btn">
            Découvrir Lehena <LhArrow />
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
