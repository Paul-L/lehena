"use client"

import { resetPassword } from "@lib/data/customer"
import { Button } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, type FormEvent } from "react"

interface Props {
  token: string
  email: string
}

export default function ResetPasswordForm({ token, email }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="max-w-sm w-full">
        <h1 className="lh-h-page mb-4">Lien invalide</h1>
        <p className="text-sm text-ui-fg-subtle leading-relaxed">
          Ce lien ne contient pas de jeton valide.
        </p>
        <LocalizedClientLink
          href="/account/forgot-password"
          className="mt-6 inline-block underline text-sm"
        >
          → Demander un nouveau lien
        </LocalizedClientLink>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const p1 = String(fd.get("password") ?? "")
    const p2 = String(fd.get("password_confirm") ?? "")
    if (p1 !== p2) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setSubmitting(true)
    const res = await resetPassword(token, p1)
    setSubmitting(false)
    if (res.success) setDone(true)
    else setError(res.error ?? "Erreur inattendue.")
  }

  if (done) {
    return (
      <div className="max-w-sm w-full">
        <h1 className="lh-h-page mb-4">
          Mot de passe mis à jour
        </h1>
        <p className="text-sm text-ui-fg-subtle leading-relaxed">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-6 inline-block underline text-sm"
        >
          → Se connecter
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="lh-h-page mb-6">Nouveau mot de passe</h1>
      {email ? (
        <p className="text-center text-sm text-ui-fg-subtle mb-6">
          Pour <strong>{email}</strong>
        </p>
      ) : null}
      <form className="w-full" onSubmit={onSubmit}>
        <div className="flex flex-col gap-y-2">
          <Input
            label="Nouveau mot de passe"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirmation"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            data-testid="confirm-password-input"
          />
        </div>
        <p className="text-xs text-ui-fg-muted mt-2">10 caractères minimum.</p>
        <ErrorMessage error={error} data-testid="reset-error" />
        <Button
          type="submit"
          isLoading={submitting}
          className="w-full mt-6"
          data-testid="reset-submit"
        >
          Mettre à jour
        </Button>
      </form>
    </div>
  )
}
