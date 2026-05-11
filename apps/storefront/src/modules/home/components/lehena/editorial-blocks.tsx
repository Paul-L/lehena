import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Placeholder } from "@modules/common/components/lehena/primitives"

const CARDS: {
  title: string
  subtitle: string
  desc: string
  tone: "encre" | "argile" | "olive"
  href: string
}[] = [
  {
    title: "Patxaran",
    subtitle: "Liqueur de prunelles sauvages",
    desc: "Macération 8 mois selon la recette des Laminak.",
    tone: "encre",
    href: "/categories/patxaran",
  },
  {
    title: "Salaisons",
    subtitle: "Chorizo, lomo, ventrêche",
    desc: "Hachage à la main, embossage en boyaux naturels.",
    tone: "argile",
    href: "/categories/salaisons",
  },
  {
    title: "Épicerie fine",
    subtitle: "Plats cuisinés du Pays Basque",
    desc: "Axoa, piperade, mijotés à l'ancienne.",
    tone: "olive",
    href: "/categories/epicerie",
  },
]

export default function LehenaEditorialBlocks() {
  return (
    <section className="reveal" style={{ padding: "120px 0" }}>
      <div className="lh-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          {CARDS.map((card) => (
            <LocalizedClientLink
              key={card.title}
              href={card.href}
              style={{ display: "block" }}
            >
              <Placeholder label={card.title} aspect="4/5" tone={card.tone} />
              <div style={{ padding: "20px 4px 0" }}>
                <h3
                  className="serif-display"
                  style={{ fontSize: 26, marginBottom: 6 }}
                >
                  {card.title}
                </h3>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  {card.subtitle}
                </div>
                <p
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 15,
                    color: "var(--ink-soft)",
                    lineHeight: 1.5,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}
