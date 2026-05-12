import ForgotPasswordForm from "@modules/account/components/forgot-password"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mot de passe oublié — Lehena",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full flex justify-start px-8 py-8">
      <ForgotPasswordForm />
    </div>
  )
}
