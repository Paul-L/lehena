import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Placeholder,
} from "@modules/common/components/lehena/primitives"
import { LhArrow } from "@modules/common/components/lehena/icons"

const FEATURED: {
  slug: string
  category: string
  name: string
  subtitle: string
  price: number
  badge: string
  tone: "rouge" | "encre" | "argile" | "olive" | "kraft" | "creme"
  placeholder: string
}[] = [
  {
    slug: "jambon-orhi-24-mois",
    category: "Jambon",
    name: "Jambon Orhi · 24 mois",
    subtitle: "Race Duroc, sans nitrite",
    price: 195,
    badge: "Signature",
    tone: "rouge",
    placeholder: "Jambon Orhi",
  },
  {
    slug: "patxaran-laminak",
    category: "Patxaran",
    name: "Patxaran Laminak",
    subtitle: "Liqueur de prunelles · 8 mois",
    price: 28,
    badge: "Édition limitée",
    tone: "encre",
    placeholder: "Patxaran",
  },
  {
    slug: "demi-ventreche",
    category: "Salaisons",
    name: "Demi-ventrêche",
    subtitle: "Affinage 6 mois, sel sec",
    price: 32,
    badge: "Bestseller",
    tone: "argile",
    placeholder: "Ventrêche",
  },
  {
    slug: "axoa",
    category: "Plats cuisinés",
    name: "Axoa de veau",
    subtitle: "Recette du Pays Basque",
    price: 14,
    badge: "Nouveau",
    tone: "olive",
    placeholder: "Axoa",
  },
]

export default function LehenaSelection() {
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
      <div className="lh-wrap">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            marginBottom: 56,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Choisissez l'authenticité
            </div>
            <h2
              className="serif-display"
              style={{
                fontSize: "var(--step-5)",
                lineHeight: 1,
                maxWidth: 600,
              }}
            >
              La sélection
              <br />
              <em style={{ fontStyle: "italic" }}>de l'artisan.</em>
            </h2>
          </div>
          <LocalizedClientLink href="/store" className="btn">
            Toute la boutique <LhArrow />
          </LocalizedClientLink>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 28,
          }}
        >
          {FEATURED.map((p) => (
            <article key={p.slug} style={{ position: "relative" }}>
              <LocalizedClientLink
                href={`/products/${p.slug}`}
                style={{ display: "block" }}
              >
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <Placeholder label={p.placeholder} aspect="4/5" tone={p.tone} />
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      maxWidth: "calc(100% - 28px)",
                    }}
                  >
                    <span className="chip chip-solid" style={{ fontSize: 9 }}>
                      {p.badge}
                    </span>
                  </div>
                </div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {p.category}
                </div>
                <h3
                  className="serif-display"
                  style={{ fontSize: 22, marginBottom: 4, lineHeight: 1.1 }}
                >
                  {p.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    marginBottom: 12,
                  }}
                >
                  {p.subtitle}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span className="serif" style={{ fontSize: 20 }}>
                    {p.price.toFixed(2)} €
                  </span>
                </div>
              </LocalizedClientLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
