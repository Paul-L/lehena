"use client"

import { signout } from "@lib/data/customer"
import { useParams } from "next/navigation"
import { useTransition } from "react"

export default function LogoutButton() {
  const { countryCode } = useParams() as { countryCode: string }
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signout(countryCode)
        })
      }
      disabled={pending}
      data-testid="logout-button"
      className="btn btn-ghost"
      style={{ padding: "10px 18px", fontSize: 11 }}
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  )
}
