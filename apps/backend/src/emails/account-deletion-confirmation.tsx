import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface AccountDeletionConfirmationEmailProps {
  confirm_url: string
}

export default function AccountDeletionConfirmationEmail({
  confirm_url,
}: AccountDeletionConfirmationEmailProps) {
  return (
    <EmailLayout preview="Confirmez la suppression de votre compte Lehena.">
      <Text style={styles.mono}>RGPD</Text>
      <Text style={styles.h1}>
        Suppression de votre <em style={styles.rouge}>compte.</em>
      </Text>
      <Text style={styles.body}>
        Vous avez demandé la suppression définitive de votre compte. Pour
        confirmer, cliquez sur le bouton ci-dessous. Le lien est valable{" "}
        <strong>une heure</strong>.
      </Text>
      <Button href={confirm_url} style={styles.button}>
        Confirmer la suppression
      </Button>
      <Text style={{ ...styles.body, marginTop: 24 }}>
        Cette action est <strong>irréversible</strong>. Vos données personnelles
        seront anonymisées immédiatement. Vos commandes passées sont conservées
        de manière anonymisée pendant 10 ans (obligation comptable française).
      </Text>
      <Text style={styles.small}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email — aucune action ne sera entreprise.
      </Text>
    </EmailLayout>
  )
}
