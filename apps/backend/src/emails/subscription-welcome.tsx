import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface SubscriptionWelcomeEmailProps {
  customer_name?: string | null
  plan_name: string
  storefront_url: string
}

export default function SubscriptionWelcomeEmail({
  customer_name,
  plan_name,
  storefront_url,
}: SubscriptionWelcomeEmailProps) {
  const name = customer_name?.trim() || "Bienvenue"
  return (
    <EmailLayout preview={`Votre abonnement ${plan_name} est confirmé.`}>
      <Text style={styles.mono}>NOUVELLE BOX</Text>
      <Text style={styles.h1}>
        Bienvenue dans le <em style={styles.rouge}>cercle, {name}.</em>
      </Text>
      <Text style={styles.body}>
        Votre abonnement <strong>{plan_name}</strong> est confirmé. La première
        box partira sous quelques jours — vous recevrez un email avec le suivi
        dès l&apos;expédition.
      </Text>
      <Text style={styles.body}>
        Chaque mois, notre atelier compose votre sélection : ce qui sort le
        mieux de cave, ce qui mérite d&apos;être goûté en ce moment. Aucun
        engagement : suspendez, annulez, modifiez la cadence depuis votre espace
        client.
      </Text>
      <Button
        href={`${storefront_url}/fr/account/subscriptions`}
        style={styles.button}
      >
        Gérer mon abonnement
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Une question, un changement d&apos;adresse, un cadeau à offrir ?
        Répondez simplement à cet email.
      </Text>
    </EmailLayout>
  )
}
