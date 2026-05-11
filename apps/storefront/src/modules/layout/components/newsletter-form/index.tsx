"use client"

import { LhArrow, LhCheck } from "@modules/common/components/lehena/icons"
import { useState, type FormEvent } from "react"

type Status = "idle" | "loading" | "success" | "error"

interface NewsletterFormProps {
  /** Free-text source tag passed to the API (e.g. "footer", "home-section"). */
  source: string
  /** Color tone — "dark" for footer (bg-deep), "light" for in-page sections. */
  tone?: "dark" | "light"
  successMessage?: string
}

export function NewsletterForm({
  source,
  tone = "dark",
  successMessage = "Bienvenue. À très vite.",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDark = tone === "dark"

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === "loading") return
    setStatus("loading")
    setErrorMessage(null)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      })
      const data: { ok: boolean; error?: string } = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Échec de l'inscription.")
      }
      setStatus("success")
      setEmail("")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de l'inscription."
      setErrorMessage(msg)
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex items-center gap-2 py-2"
        style={{
          color: isDark ? "var(--bg)" : "var(--ink)",
          fontFamily: "var(--mono)",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <LhCheck size={16} />
        {successMessage}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${
            isDark ? "rgba(244, 237, 224, 0.4)" : "var(--line-strong)"
          }`,
          paddingBottom: 8,
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === "error") setStatus("idle")
          }}
          placeholder="votre@email.fr"
          aria-label="Adresse email"
          autoComplete="email"
          disabled={status === "loading"}
          style={{
            flex: 1,
            background: "transparent",
            border: 0,
            color: isDark ? "var(--bg)" : "var(--ink)",
            fontFamily: "var(--serif)",
            fontSize: 18,
            outline: "none",
            padding: "8px 0",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "loading" || email.length === 0}
          aria-label="S'abonner à la newsletter"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: isDark ? "var(--bg)" : "var(--ink)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: status === "loading" ? "wait" : "pointer",
            opacity: status === "loading" || email.length === 0 ? 0.5 : 1,
          }}
        >
          {status === "loading" ? "…" : "S'abonner"}
          <LhArrow size={14} />
        </button>
      </div>
      {status === "error" && errorMessage ? (
        <p
          role="alert"
          style={{
            marginTop: 10,
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isDark ? "var(--argile)" : "var(--rouge)",
          }}
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  )
}
