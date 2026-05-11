"use client"

import { useState, type FormEvent } from "react"

interface Props {
  locale: string
  sourceSlug?: string
}

type FormState = "idle" | "submitting" | "success" | "error"

interface FieldErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const MIN_MESSAGE = 10
const MAX_MESSAGE = 5000

function validate(values: {
  name: string
  email: string
  subject: string
  message: string
}): FieldErrors {
  const out: FieldErrors = {}
  if (!values.name.trim()) out.name = "Indiquez votre nom."
  if (!values.email.trim()) out.email = "Indiquez votre adresse email."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    out.email = "Email invalide."
  if (!values.subject.trim()) out.subject = "Indiquez un sujet."
  if (values.message.trim().length < MIN_MESSAGE)
    out.message = `Le message doit faire au moins ${MIN_MESSAGE} caractères.`
  if (values.message.length > MAX_MESSAGE)
    out.message = `Le message ne peut pas dépasser ${MAX_MESSAGE} caractères.`
  return out
}

export default function ContactForm({ locale, sourceSlug }: Props) {
  const [state, setState] = useState<FormState>("idle")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const values = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    }
    const v = validate(values)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setState("submitting")
    setServerError(null)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, locale, source_slug: sourceSlug }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message ?? `HTTP ${res.status}`)
      }
      setState("success")
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erreur réseau")
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <div
        className="reveal"
        style={{
          padding: "40px",
          border: "1px solid var(--line)",
          background: "var(--bg-elevated)",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          MESSAGE REÇU
        </div>
        <h2
          className="serif-display"
          style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}
        >
          Merci, c'est noté.
        </h2>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Nous lisons chaque message et répondons sous 48 heures ouvrées. Une
          confirmation arrive à l'instant dans votre boîte mail.
        </p>
      </div>
    )
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--line)",
    background: "var(--bg)",
    padding: "12px 14px",
    fontFamily: "var(--serif)",
    fontSize: 15,
    color: "var(--ink)",
    outline: "none",
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-mute)",
    marginBottom: 6,
    fontFamily: "var(--mono)",
  }
  const errStyle: React.CSSProperties = {
    color: "var(--rouge)",
    fontSize: 12,
    marginTop: 4,
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      style={{
        display: "grid",
        gap: 20,
        maxWidth: 640,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label htmlFor="cf-name" style={labelStyle}>
            Nom
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            style={fieldStyle}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
          />
          {errors.name ? (
            <div id="cf-name-err" style={errStyle}>
              {errors.name}
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="cf-email" style={labelStyle}>
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            style={fieldStyle}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
          />
          {errors.email ? (
            <div id="cf-email-err" style={errStyle}>
              {errors.email}
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <label htmlFor="cf-subject" style={labelStyle}>
          Sujet
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          required
          style={fieldStyle}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "cf-subject-err" : undefined}
        />
        {errors.subject ? (
          <div id="cf-subject-err" style={errStyle}>
            {errors.subject}
          </div>
        ) : null}
      </div>
      <div>
        <label htmlFor="cf-message" style={labelStyle}>
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={7}
          style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
        />
        {errors.message ? (
          <div id="cf-message-err" style={errStyle}>
            {errors.message}
          </div>
        ) : null}
      </div>
      {serverError ? (
        <div
          role="alert"
          style={{
            padding: 12,
            border: "1px solid var(--rouge)",
            color: "var(--rouge)",
            fontSize: 14,
          }}
        >
          {serverError}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="submit"
          disabled={state === "submitting"}
          className="mono"
          style={{
            padding: "14px 28px",
            background: "var(--ink)",
            color: "var(--bg)",
            border: 0,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: state === "submitting" ? "wait" : "pointer",
            opacity: state === "submitting" ? 0.6 : 1,
          }}
        >
          {state === "submitting" ? "Envoi en cours…" : "Envoyer le message"}
        </button>
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            letterSpacing: "0.05em",
          }}
        >
          Réponse sous 48 h ouvrées
        </span>
      </div>
    </form>
  )
}
