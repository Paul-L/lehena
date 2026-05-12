import GdprDeleteConfirm from "@modules/account/components/gdpr-delete-confirm"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Confirmer la suppression — Lehena",
  robots: { index: false, follow: false },
}

export default async function DeleteConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-2xl-semi mb-4">Confirmer la suppression</h1>
      <GdprDeleteConfirm token={token ?? ""} />
    </div>
  )
}
