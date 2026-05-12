"use client"

import { confirmDelete } from "@lib/data/gdpr"
import { Button } from "@medusajs/ui"
import { useParams } from "next/navigation"
import { useState } from "react"

interface Props {
  token: string
}

export default function GdprDeleteConfirm({ token }: Props) {
  const params = useParams<{ countryCode?: string }>()
  const countryCode = params?.countryCode ?? "fr"
  const [state, setState] = useState<"ready" | "running" | "done" | "error">(
    "ready"
  )
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="p-4 rounded border border-ui-border-base text-sm">
        Ce lien est invalide. Demandez à nouveau la suppression depuis votre
        espace client.
      </div>
    )
  }

  if (state === "done") {
    return (
      <div className="p-4 rounded border border-ui-border-base text-sm">
        Votre compte a été anonymisé. Merci d&apos;avoir été des nôtres. Vos
        commandes passées sont conservées de manière anonymisée pendant 10 ans
        (obligation comptable).
      </div>
    )
  }

  const onConfirm = async () => {
    setState("running")
    const res = await confirmDelete(token, countryCode)
    if (!res.success) {
      setError(res.error ?? "Erreur.")
      setState("error")
    } else {
      setState("done")
    }
  }

  return (
    <div className="grid gap-y-4">
      <p className="text-sm">
        En confirmant, vos informations personnelles seront immédiatement
        anonymisées. Cette action est <strong>irréversible</strong>.
      </p>
      {error ? (
        <div className="p-3 rounded border border-ui-border-error text-sm text-ui-fg-error">
          {error}
        </div>
      ) : null}
      <Button
        variant="danger"
        onClick={onConfirm}
        isLoading={state === "running"}
        data-testid="gdpr-confirm-button"
      >
        Confirmer la suppression
      </Button>
    </div>
  )
}
