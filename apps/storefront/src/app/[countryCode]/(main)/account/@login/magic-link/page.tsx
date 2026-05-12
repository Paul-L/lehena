import MagicLinkRequestForm from "@modules/account/components/magic-link-request"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion par lien magique — Lehena",
  robots: { index: false, follow: false },
}

export default function MagicLinkPage() {
  return (
    <div className="w-full flex justify-start px-8 py-8">
      <MagicLinkRequestForm />
    </div>
  )
}
