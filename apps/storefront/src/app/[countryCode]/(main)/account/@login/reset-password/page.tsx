import ResetPasswordForm from "@modules/account/components/reset-password"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Réinitialiser mon mot de passe — Lehena",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams
  return (
    <div className="w-full flex justify-start px-8 py-8">
      <ResetPasswordForm token={token ?? ""} email={email ?? ""} />
    </div>
  )
}
