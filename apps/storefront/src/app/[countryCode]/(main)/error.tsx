"use client"

import { LhArrow } from "@modules/common/components/lehena/icons"
import { Frieze } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect } from "react"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Phase 12 wires Sentry here; for now a console.error is enough.
    console.error("[storefront-error]", error)
  }, [error])

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
        gap: 48,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          className="eyebrow"
          style={{ color: "var(--rouge)", marginBottom: 14 }}
        >
          Une erreur inattendue
        </div>
        <h1
          className="serif-display"
          style={{ fontSize: "var(--step-6)", lineHeight: 0.95 }}
        >
          Pardon,
          <br />
          <em style={{ fontStyle: "italic", color: "var(--argile-ink)" }}>
            l'atelier a hoqueté.
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
            maxWidth: 540,
          }}
        >
          Quelque chose s'est mal passé en chargeant cette page. Si le problème
          persiste, n'hésitez pas à nous écrire — on est là.
        </p>
        {error.digest ? (
          <div
            className="mono"
            style={{
              marginTop: 16,
              fontSize: 10,
              color: "var(--ink-mute)",
              letterSpacing: "0.1em",
            }}
          >
            Référence : {error.digest}
          </div>
        ) : null}
      </div>

      <Frieze color="var(--line-strong)" size={8} opacity={0.6} />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <button type="button" onClick={() => reset()} className="btn btn-rouge">
          Réessayer
        </button>
        <LocalizedClientLink href="/" className="btn">
          Retour à l'accueil <LhArrow />
        </LocalizedClientLink>
        <a href="mailto:contact@lehena.fr" className="btn">
          Nous écrire
        </a>
      </div>
    </main>
  )
}
