import {
  LhAward,
  LhLeaf,
  LhTruck,
} from "@modules/common/components/lehena/icons"
import { Frieze, Logo } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { NewsletterForm } from "@modules/layout/components/newsletter-form"

const FOOTER_COLS: {
  title: string
  links: { label: string; href: string }[]
}[] = [
  {
    title: "Maison",
    links: [
      { label: "Notre histoire", href: "/notre-histoire" },
      { label: "De la ferme à l'assiette", href: "/la-ferme" },
      { label: "Savoir-faire", href: "/savoir-faire" },
      { label: "Actualités", href: "/actualites" },
    ],
  },
  {
    title: "Boutique",
    links: [
      { label: "Tous les produits", href: "/store" },
      { label: "Jambons d'Iparralde", href: "/categories/jambons-iparralde" },
      { label: "Salaisons", href: "/categories/salaisons" },
      { label: "Coffrets cadeaux", href: "/categories/coffrets-cadeaux" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Livraison", href: "/livraison" },
      { label: "Conservation", href: "/conservation" },
      { label: "Nous contacter", href: "/contact" },
      { label: "CGV", href: "/cgv" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
]

const PAYMENT_BADGES = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"]

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
                Recettes, nouveaux affinages, ouvertures de cave. Une lettre par
                mois, jamais plus.
              </p>
              <NewsletterForm source="footer" tone="dark" />
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
            <address
              style={{
                fontStyle: "normal",
                fontSize: 13,
                color: "rgba(244, 237, 224, 0.7)",
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              Maison Lehena
              <br />
              Bourg
              <br />
              64470 Laguinge
              <br />
              Pays Basque, France
            </address>
            <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
              <a
                href="https://www.facebook.com/maisonlehena"
                target="_blank"
                rel="noopener noreferrer"
                style={socialIconStyle}
                aria-label="Maison Lehena sur Facebook"
              >
                F
              </a>
              <a
                href="https://www.instagram.com/maisonlehena"
                target="_blank"
                rel="noopener noreferrer"
                style={socialIconStyle}
                aria-label="Maison Lehena sur Instagram"
              >
                I
              </a>
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

        {/* ─── Badges row : paiement · livraison · origine ─── */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 32,
            borderTop: "1px solid rgba(244, 237, 224, 0.15)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 32,
            alignItems: "center",
            color: "rgba(244, 237, 224, 0.75)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="eyebrow"
              style={{ color: "rgba(244, 237, 224, 0.5)" }}
            >
              Paiement sécurisé
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {PAYMENT_BADGES.map((b) => (
                <span
                  key={b}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 8px",
                    border: "1px solid rgba(244, 237, 224, 0.3)",
                    borderRadius: 4,
                    color: "rgba(244, 237, 224, 0.85)",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="eyebrow"
              style={{ color: "rgba(244, 237, 224, 0.5)" }}
            >
              Livraison
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <LhTruck size={16} /> Chronofresh
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <LhTruck size={16} /> Colissimo
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="eyebrow"
              style={{ color: "rgba(244, 237, 224, 0.5)" }}
            >
              Origine
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <LhAward size={16} /> Pays Basque
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <LhLeaf size={16} /> Sans nitrite
              </span>
            </div>
          </div>
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
        <span>
          © {new Date().getFullYear()} Maison Lehena · Tous droits réservés
        </span>
        <span>SIRET à venir · TVA FR à venir</span>
      </div>
    </footer>
  )
}

const socialIconStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(244, 237, 224, 0.3)",
  display: "grid",
  placeItems: "center",
  fontSize: 11,
  fontFamily: "var(--mono)",
  color: "var(--bg)",
} as const
