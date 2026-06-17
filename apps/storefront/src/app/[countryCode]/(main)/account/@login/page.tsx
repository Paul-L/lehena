import LoginTemplate from "@modules/account/templates/login-template"
import { type Metadata } from "next"

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace client Maison Lehena.",
  robots: { index: false, follow: false },
}

export default function Login() {
  return <LoginTemplate />
}
