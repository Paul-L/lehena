import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface PasswordResetEmailProps {
  reset_url: string
}

export default function PasswordResetEmail({
  reset_url,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Lien pour réinitialiser votre mot de passe Lehena.">
      <Text style={styles.mono}>SÉCURITÉ</Text>
      <Text style={styles.h1}>
        Mot de passe <em style={styles.rouge}>oublié.</em>
      </Text>
      <Text style={styles.body}>
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        Le lien est valable <strong>15 minutes</strong>.
      </Text>
      <Button href={reset_url} style={styles.button}>
        Réinitialiser mon mot de passe
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email. Votre mot de passe restera inchangé.
      </Text>
    </EmailLayout>
  )
}
