import MagicLinkCallback from "@modules/account/components/magic-link-callback"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion en cours — Lehena",
  robots: { index: false, follow: false },
}

export default async function MagicLinkCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <div className="w-full flex justify-start px-8 py-8">
      <MagicLinkCallback token={token ?? ""} />
    </div>
  )
}
