import { Photo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CARDS: {
  title: string
  subtitle: string
  desc: string
  src: string
  alt: string
  href: string
}[] = [
  {
    title: "Patxaran",
    subtitle: "Liqueur de prunelles sauvages",
    desc: "Macération 8 mois selon la recette des Laminak.",
    src: "/images/home-patxaran.webp",
    alt: "Bouteille de Patxaran Lehena et son verre, prunelles sauvages",
    href: "/categories/patxaran-spiritueux",
  },
  {
    title: "Salaisons",
    subtitle: "Chorizo, lomo, ventrêche",
    desc: "Hachage à la main, embossage en boyaux naturels.",
    src: "/images/home-salaisons.webp",
    alt: "Chiffonade de salaisons du Pays Basque sur planche en bois",
    href: "/categories/salaisons",
  },
  {
    title: "Épicerie fine",
    subtitle: "Plats cuisinés du Pays Basque",
    desc: "Axoa, piperade, mijotés à l'ancienne.",
    src: "/images/home-epicerie.webp",
    alt: "Plat cuisiné du Pays Basque mijoté à l'ancienne, servi en cocotte",
    href: "/categories/epicerie-fine",
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
              <Photo
                src={card.src}
                alt={card.alt}
                aspect="4/5"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
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
