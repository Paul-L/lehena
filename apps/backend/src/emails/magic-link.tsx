import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface MagicLinkEmailProps {
  magic_url: string
}

export default function MagicLinkEmail({ magic_url }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview="Votre lien de connexion Lehena.">
      <Text style={styles.mono}>CONNEXION</Text>
      <Text style={styles.h1}>
        Votre lien <em style={styles.rouge}>magique.</em>
      </Text>
      <Text style={styles.body}>
        Cliquez sur le bouton ci-dessous pour vous connecter sans mot de passe.
        Le lien est valable <strong>15 minutes</strong>, et ne peut être utilisé
        qu&apos;une seule fois.
      </Text>
      <Button href={magic_url} style={styles.button}>
        Me connecter
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email — aucun compte n&apos;a été modifié.
      </Text>
    </EmailLayout>
  )
}
