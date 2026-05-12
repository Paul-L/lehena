import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface NewsletterDoubleOptInEmailProps {
  confirm_url: string
}

export default function NewsletterDoubleOptInEmail({
  confirm_url,
}: NewsletterDoubleOptInEmailProps) {
  return (
    <EmailLayout preview="Confirmez votre inscription à la newsletter Lehena.">
      <Text style={styles.mono}>NEWSLETTER</Text>
      <Text style={styles.h1}>
        Confirmez votre <em style={styles.rouge}>inscription.</em>
      </Text>
      <Text style={styles.body}>
        Merci de votre intérêt pour la maison Lehena. Cliquez sur le bouton
        ci-dessous pour valider votre inscription à notre newsletter.
      </Text>
      <Button href={confirm_url} style={styles.button}>
        Confirmer
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email. Aucune inscription ne sera enregistrée.
      </Text>
    </EmailLayout>
  )
}
