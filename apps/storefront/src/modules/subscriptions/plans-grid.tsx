"use client"

import { startSubscriptionCheckout } from "@lib/data/subscriptions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

import type { SubscriptionPlan } from "@lib/data/subscriptions"

interface Props {
  plans: SubscriptionPlan[]
  isCustomer: boolean
}

const formatMoney = (cents: number) => `${(cents / 100).toFixed(0)} €`

/**
 * Client-side grid of subscription plans with a server-action CTA that
 * redirects the visitor to a Stripe Checkout Session. Guests get a CTA
 * back to /account first — Stripe Checkout needs a customer id we can
 * stamp on the subscription metadata.
 */
export default function SubscriptionPlansGrid({ plans, isCustomer }: Props) {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subscribe = async (slug: string) => {
    if (!isCustomer) return
    setSubmitting(slug)
    setError(null)
    const res = await startSubscriptionCheckout(slug)
    setSubmitting(null)
    if (res.checkout_url) {
      window.location.href = res.checkout_url
    } else {
      setError(
        res.error ??
          "Les abonnements sont temporairement indisponibles. Revenez plus tard."
      )
    }
  }

  if (plans.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: 16,
          color: "var(--ink-soft)",
        }}
      >
        Les abonnements ne sont pas encore activés sur cet environnement.
        Revenez bientôt.
      </p>
    )
  }

  return (
    <div>
      {error ? (
        <div
          style={{
            padding: 12,
            border: "1px solid var(--rouge)",
            color: "var(--rouge)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: "1px solid var(--line)",
              background: "var(--bg-elevated, #fbf7ee)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div className="eyebrow" style={{ color: "var(--ink-mute)" }}>
              {plan.box_size} pièces / mois
            </div>
            <h2
              className="serif-display"
              style={{
                fontSize: 32,
                lineHeight: 1.05,
              }}
            >
              {plan.name}
            </h2>
            {plan.description ? (
              <p
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  color: "var(--ink-soft)",
                  lineHeight: 1.55,
                  flex: 1,
                }}
              >
                {plan.description}
              </p>
            ) : null}
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 28,
                color: "var(--ink)",
              }}
            >
              {formatMoney(plan.price_cents)}
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  marginLeft: 6,
                  color: "var(--ink-mute)",
                  letterSpacing: "0.08em",
                }}
              >
                / MOIS
              </span>
            </div>
            {isCustomer ? (
              <button
                type="button"
                onClick={() => subscribe(plan.slug)}
                disabled={submitting !== null}
                className="mono"
                style={{
                  padding: "14px 24px",
                  background: "var(--ink)",
                  color: "var(--bg)",
                  border: 0,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: submitting === plan.slug ? "wait" : "pointer",
                  opacity: submitting === plan.slug ? 0.6 : 1,
                }}
              >
                {submitting === plan.slug ? "Préparation…" : "Je m'abonne"}
              </button>
            ) : (
              <LocalizedClientLink
                href="/account"
                className="mono"
                style={{
                  padding: "14px 24px",
                  background: "var(--ink)",
                  color: "var(--bg)",
                  textAlign: "center",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Se connecter pour s&apos;abonner
              </LocalizedClientLink>
            )}
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-mute)",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              ANNULABLE À TOUT MOMENT · LIVRAISON OFFERTE
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
