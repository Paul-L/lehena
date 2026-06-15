import { buildMetadata } from "@lib/seo/metadata"
import { LhArrow } from "@modules/common/components/lehena/icons"
import { Frieze } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import type { Metadata } from "next"

export const metadata: Metadata = buildMetadata({
  title: "Introuvable · 404",
  description:
    "La page que vous cherchez n'existe pas ou a été déplacée. Découvrez notre boutique.",
  noindex: true,
})

const SUGGESTIONS: { label: string; href: string; tone: string }[] = [
  {
    label: "Jambons d'Iparralde",
    href: "/categories/jambons-iparralde",
    tone: "var(--rouge)",
  },
  {
    label: "Salaisons & saucissons",
    href: "/categories/salaisons",
    tone: "var(--terre)",
  },
  {
    label: "Patxaran & spiritueux",
    href: "/categories/patxaran-spiritueux",
    tone: "var(--olive)",
  },
  {
    label: "Coffrets & cadeaux",
    href: "/categories/coffrets-cadeaux",
    tone: "var(--argile)",
  },
]

export default function NotFound() {
  return (
    <main
      className="lh-wrap"
      style={{
        minHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingTop: 80,
        paddingBottom: 80,
        gap: 56,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          className="eyebrow"
          style={{ color: "var(--rouge)", marginBottom: 14 }}
        >
          Erreur 404 · Introuvable
        </div>
        <h1
          className="serif-display"
          style={{ fontSize: "var(--step-6)", lineHeight: 0.95 }}
        >
          Cette page
          <br />
          <em style={{ fontStyle: "italic", color: "var(--argile-ink)" }}>
            n'existe plus.
          </em>
        </h1>
        <p
          className="serif"
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--ink-soft)",
            marginTop: 24,
            lineHeight: 1.55,
            maxWidth: 560,
          }}
        >
          Peut-être avez-vous suivi un ancien lien, ou peut-être l'avons-nous
          retirée. Dans tous les cas, voici quelques pistes pour retrouver le
          fil.
        </p>
      </div>

      <Frieze color="var(--line-strong)" size={8} opacity={0.6} />

      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 24, color: "var(--ink-mute)" }}
        >
          Explorer la maison
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {SUGGESTIONS.map((s) => (
            <LocalizedClientLink
              key={s.href}
              href={s.href}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 28,
                aspectRatio: "4 / 5",
                padding: 22,
                background: s.tone,
                color: "var(--bg)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 11, letterSpacing: "0.12em" }}
              >
                Catégorie
              </span>
              <span
                className="serif-display"
                style={{
                  fontSize: 24,
                  lineHeight: 1.05,
                }}
              >
                {s.label}
                <span style={{ display: "inline-flex", marginLeft: 8 }}>
                  <LhArrow size={16} />
                </span>
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
        }}
      >
        <LocalizedClientLink href="/" className="btn btn-rouge">
          Retour à l'accueil
        </LocalizedClientLink>
        <LocalizedClientLink href="/store" className="btn">
          Voir toute la boutique <LhArrow />
        </LocalizedClientLink>
      </div>
    </main>
  )
}
