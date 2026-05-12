"use client"

import { verifyMagicLink } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface Props {
  token: string
}

/**
 * Client component that fires `verifyMagicLink` once on mount and either
 * redirects to /account on success or shows an error state. We guard with a
 * ref so React StrictMode double-invocation doesn't burn the token twice
 * (since the backend treats it as stateless, but cosmetically we want to
 * show a single result).
 */
export default function MagicLinkCallback({ token }: Props) {
  const router = useRouter()
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode ?? "fr"
  const ran = useRef(false)
  const [state, setState] = useState<"verifying" | "success" | "error">(
    "verifying"
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!token) {
      setState("error")
      setError("Lien invalide.")
      return
    }
    verifyMagicLink(token).then((res) => {
      if (res.success) {
        setState("success")
        // Small delay so the user sees the success state before the
        // dashboard loads.
        setTimeout(() => {
          router.replace(`/${countryCode}/account`)
        }, 600)
      } else {
        setState("error")
        setError(res.error ?? "Lien expiré.")
      }
    })
  }, [token, router, countryCode])

  if (state === "verifying") {
    return (
      <div className="max-w-sm w-full">
        <h1 className="text-large-semi uppercase mb-4">Connexion en cours…</h1>
        <p className="text-sm text-ui-fg-subtle">
          Veuillez patienter, nous vérifions votre lien.
        </p>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="max-w-sm w-full">
        <h1 className="text-large-semi uppercase mb-4">Connecté</h1>
        <p className="text-sm text-ui-fg-subtle">
          Redirection vers votre espace client…
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full">
      <h1 className="text-large-semi uppercase mb-4">Lien invalide</h1>
      <p className="text-sm text-ui-fg-subtle leading-relaxed">
        {error ?? "Ce lien a expiré ou a déjà été utilisé."}
      </p>
      <div className="mt-6 flex gap-4 text-sm">
        <LocalizedClientLink href="/account/magic-link" className="underline">
          → Demander un nouveau lien
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/account"
          className="underline text-ui-fg-subtle"
        >
          Connexion classique
        </LocalizedClientLink>
      </div>
    </div>
  )
}
