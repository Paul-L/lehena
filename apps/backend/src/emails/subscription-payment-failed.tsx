import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface SubscriptionPaymentFailedEmailProps {
  customer_name?: string | null
  storefront_url: string
}

export default function SubscriptionPaymentFailedEmail({
  customer_name,
  storefront_url,
}: SubscriptionPaymentFailedEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview="Action requise — votre paiement n'a pas pu être enregistré.">
      <Text style={styles.mono}>PAIEMENT</Text>
      <Text style={styles.h1}>
        Petit souci de paiement, <em style={styles.rouge}>{name}.</em>
      </Text>
      <Text style={styles.body}>
        Le prélèvement de votre abonnement n&apos;a pas abouti — votre banque a
        refusé la transaction ou la carte est expirée. Nous retentons
        automatiquement plusieurs fois dans les jours qui viennent, mais le plus
        simple est de mettre à jour votre moyen de paiement depuis l&apos;espace
        client.
      </Text>
      <Button
        href={`${storefront_url}/fr/account/subscriptions`}
        style={styles.button}
      >
        Mettre à jour ma carte
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Si vous ne souhaitez plus poursuivre l&apos;abonnement, vous pouvez
        l&apos;annuler depuis la même page — sans frais.
      </Text>
    </EmailLayout>
  )
}
