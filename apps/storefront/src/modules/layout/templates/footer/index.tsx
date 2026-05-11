import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Frieze, Logo } from "@modules/common/components/lehena/primitives"
import { LhArrow } from "@modules/common/components/lehena/icons"

const FOOTER_COLS: {
  title: string
  links: { label: string; href: string }[]
}[] = [
  {
    title: "Maison",
    links: [
      { label: "Notre histoire", href: "/histoire" },
      { label: "De la ferme à l'assiette", href: "/ferme" },
      { label: "Savoir-faire", href: "/histoire" },
      { label: "Actualités", href: "/histoire" },
    ],
  },
  {
    title: "Boutique",
    links: [
      { label: "Tous les produits", href: "/store" },
      { label: "Jambons", href: "/categories/jambons" },
      { label: "Salaisons", href: "/categories/salaisons" },
      { label: "Coffrets cadeaux", href: "/store" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Livraison", href: "/histoire" },
      { label: "Conservation", href: "/histoire" },
      { label: "Nous contacter", href: "/histoire" },
      { label: "Mentions légales", href: "/histoire" },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-deep)",
        color: "var(--bg)",
        marginTop: 80,
      }}
    >
      <Frieze color="var(--rouge)" size={14} />

      <div className="lh-wrap" style={{ paddingTop: 80, paddingBottom: 40 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 80,
            marginBottom: 64,
            alignItems: "end",
          }}
        >
          <div>
            <div
              className="eyebrow"
              style={{ color: "rgba(244, 237, 224, 0.6)" }}
            >
              Maître Artisan Charcutier · Pays Basque
            </div>
            <h2
              className="serif-display"
              style={{
                fontSize: "var(--step-6)",
                marginTop: 16,
                lineHeight: 0.95,
                color: "var(--bg)",
              }}
            >
              Du sel,
              <br />
              <em style={{ fontStyle: "italic", color: "var(--argile)" }}>
                du temps,
              </em>
              <br />
              et rien d'autre.
            </h2>
          </div>
          <div>
            <div
              style={{
                borderTop: "1px solid rgba(244, 237, 224, 0.2)",
                paddingTop: 24,
              }}
            >
              <div
                className="eyebrow"
                style={{
                  color: "rgba(244, 237, 224, 0.6)",
                  marginBottom: 12,
                }}
              >
                Newsletter
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(244, 237, 224, 0.8)",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                Recettes, nouveaux affinages, ouvertures de cave. Une lettre
                par mois, jamais plus.
              </p>
              <form
                style={{
                  display: "flex",
                  borderBottom: "1px solid rgba(244, 237, 224, 0.4)",
                  paddingBottom: 8,
                }}
              >
                <input
                  type="email"
                  placeholder="votre@email.fr"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: 0,
                    color: "var(--bg)",
                    fontFamily: "var(--serif)",
                    fontSize: 18,
                    outline: "none",
                    padding: "8px 0",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--bg)",
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  S'abonner <LhArrow size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
            gap: 60,
            paddingTop: 48,
            borderTop: "1px solid rgba(244, 237, 224, 0.15)",
          }}
        >
          <div>
            <div style={{ marginBottom: 16, filter: "brightness(1.1)" }}>
              <Logo height={56} />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(244, 237, 224, 0.7)",
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              Maison Lehena
              <br />
              Quartier Galharaga
              <br />
              64430 Saint-Étienne-de-Baïgorry
              <br />
              Pays Basque, France
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
              {["Facebook", "Instagram"].map((s) => (
                <a
                  key={s}
                  href="#"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid rgba(244, 237, 224, 0.3)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                  }}
                  aria-label={s}
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div
                className="eyebrow"
                style={{
                  color: "rgba(244, 237, 224, 0.5)",
                  marginBottom: 18,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <LocalizedClientLink
                      href={link.href}
                      style={{
                        fontSize: 14,
                        color: "var(--bg)",
                        fontFamily: "var(--serif)",
                      }}
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Frieze color="rgba(244, 237, 224, 0.3)" size={8} />
      <div
        className="lh-wrap"
        style={{
          padding: "24px 0",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          fontSize: 12,
          color: "rgba(244, 237, 224, 0.5)",
          fontFamily: "var(--mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>© {new Date().getFullYear()} Maison Lehena · Tous droits réservés</span>
        <span>Paiement sécurisé · Livraison Chronofresh</span>
      </div>
    </footer>
  )
}
