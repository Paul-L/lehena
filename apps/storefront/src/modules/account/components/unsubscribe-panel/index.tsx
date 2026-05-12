"use client"

import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

interface Props {
  token: string
}

/**
 * One-click unsubscribe page rendered behind email links. Posts the
 * signed token to /api/preferences/unsubscribe which proxies to the backend
 * route (keeps the publishable-key on the server).
 */
export default function UnsubscribePanel({ token }: Props) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  )
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          Pour gérer vos préférences avec plus de finesse (newsletter, recettes,
          date de naissance), connectez-vous à votre espace client.
        </p>
        <p style={{ marginTop: 16 }}>
          <LocalizedClientLink
            href="/account"
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "underline",
            }}
          >
            → Se connecter
          </LocalizedClientLink>
        </p>
      </div>
    )
  }

  if (state === "done") {
    return (
      <div>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          ✓ Vous êtes désinscrit de nos communications marketing. Les emails
          transactionnels (commandes, expéditions) continuent d&apos;arriver —
          ils sont nécessaires au bon déroulement de votre relation avec la
          maison.
        </p>
        <p
          className="mono"
          style={{ marginTop: 24, fontSize: 11, color: "var(--ink-mute)" }}
        >
          Pour ajuster les préférences à la carte, connectez-vous à votre espace
          client.
        </p>
      </div>
    )
  }

  const unsubscribe = async () => {
    setState("running")
    setError(null)
    try {
      const res = await fetch("/api/preferences/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message ?? `HTTP ${res.status}`)
      }
      setState("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.")
      setState("error")
    }
  }

  return (
    <div>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-soft)" }}>
        Cliquez ci-dessous pour vous désinscrire des emails marketing (offres,
        nouveautés, ventes privées). Vous continuerez à recevoir les emails
        transactionnels liés à vos commandes.
      </p>
      {error ? (
        <p style={{ marginTop: 16, color: "var(--rouge)", fontSize: 14 }}>
          {error}
        </p>
      ) : null}
      <div style={{ marginTop: 24 }}>
        <Button
          onClick={unsubscribe}
          isLoading={state === "running"}
          variant="danger"
          data-testid="unsubscribe-btn"
        >
          Me désinscrire des emails marketing
        </Button>
      </div>
    </div>
  )
}
