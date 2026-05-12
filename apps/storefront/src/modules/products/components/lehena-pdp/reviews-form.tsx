"use client"

import { submitProductReview } from "@lib/data/reviews"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, type FormEvent } from "react"

interface Props {
  productId: string
  isCustomer: boolean
}

/**
 * Inline form for authenticated customers. Non-customers get a CTA to the
 * login page. The submission only succeeds if the backend confirms the
 * customer has purchased this product — otherwise the form surfaces the
 * server error inline.
 */
export default function LehenaReviewForm({ productId, isCustomer }: Props) {
  const [rating, setRating] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!isCustomer) {
    return (
      <LocalizedClientLink
        href="/account"
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textDecoration: "underline",
          color: "var(--ink)",
        }}
      >
        → Se connecter pour laisser un avis
      </LocalizedClientLink>
    )
  }

  if (done) {
    return (
      <div
        style={{
          padding: 12,
          background: "var(--bg-elevated, #f7f4ee)",
          border: "1px solid var(--line)",
          fontSize: 13,
          color: "var(--ink-soft)",
          lineHeight: 1.5,
        }}
      >
        Merci ! Votre avis est en attente de modération — il s&apos;affichera
        après vérification.
      </div>
    )
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (rating < 1 || rating > 5) {
      setError("Choisissez une note entre 1 et 5.")
      return
    }
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const res = await submitProductReview({
      productId,
      rating,
      title: String(fd.get("title") ?? "") || undefined,
      body: String(fd.get("body") ?? ""),
    })
    setSubmitting(false)
    if (res.success) {
      setDone(true)
    } else {
      setError(res.error ?? "Erreur.")
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "grid", gap: 8, maxWidth: 320 }}
    >
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>
        VOTRE NOTE
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} étoiles`}
            style={{
              padding: 4,
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: n <= rating ? "var(--rouge)" : "var(--ink-mute)",
              fontSize: 18,
            }}
          >
            ★
          </button>
        ))}
      </div>
      <input
        name="title"
        type="text"
        maxLength={120}
        placeholder="Titre court (optionnel)"
        style={{
          fontFamily: "var(--serif)",
          fontSize: 14,
          padding: 8,
          border: "1px solid var(--line)",
          background: "var(--bg)",
        }}
      />
      <textarea
        name="body"
        rows={4}
        required
        minLength={10}
        maxLength={2000}
        placeholder="Votre retour après dégustation…"
        style={{
          fontFamily: "var(--serif)",
          fontSize: 14,
          padding: 8,
          border: "1px solid var(--line)",
          background: "var(--bg)",
          resize: "vertical",
        }}
      />
      {error ? (
        <p style={{ color: "var(--rouge)", fontSize: 12, margin: 0 }}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mono"
        style={{
          padding: "10px 16px",
          background: "var(--ink)",
          color: "var(--bg)",
          border: 0,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Envoi…" : "Publier mon avis"}
      </button>
    </form>
  )
}
