"use client"

import { requestMagicLink } from "@lib/data/customer"
import { Button } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState, type FormEvent } from "react"

export default function MagicLinkRequestForm() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "")
    const res = await requestMagicLink(email)
    setSubmitting(false)
    if (res.success) setDone(true)
    else setError(res.error ?? "Erreur inattendue.")
  }

  if (done) {
    return (
      <div className="max-w-sm w-full">
        <h1 className="lh-h-page mb-4">
          Vérifiez votre boîte mail
        </h1>
        <p className="text-sm text-ui-fg-subtle leading-relaxed">
          Si un compte existe pour cette adresse, vous recevrez un lien de
          connexion valable 15 minutes. Pas besoin de mot de passe.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-6 inline-block underline text-sm"
        >
          ← Retour à la connexion classique
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="lh-h-page mb-6">Lien magique</h1>
      <p className="text-center text-sm text-ui-fg-subtle mb-8">
        Recevez par email un lien qui vous connecte directement, sans mot de
        passe.
      </p>
      <form className="w-full" onSubmit={onSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="magic-link-email-input"
        />
        <ErrorMessage error={error} data-testid="magic-link-error" />
        <Button
          type="submit"
          isLoading={submitting}
          className="w-full mt-6"
          data-testid="magic-link-submit"
        >
          Envoyer le lien
        </Button>
      </form>
      <LocalizedClientLink
        href="/account"
        className="mt-6 text-sm underline text-ui-fg-subtle"
      >
        ← Connexion par mot de passe
      </LocalizedClientLink>
    </div>
  )
}
