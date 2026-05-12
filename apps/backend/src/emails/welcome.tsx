import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface WelcomeEmailProps {
  first_name?: string | null
  storefront_url: string
}

export default function WelcomeEmail({
  first_name,
  storefront_url,
}: WelcomeEmailProps) {
  const name = first_name?.trim() || "amateur de bons produits"
  return (
    <EmailLayout preview="Bienvenue chez Maison Lehena.">
      <Text style={styles.mono}>BIENVENUE</Text>
      <Text style={styles.h1}>
        Bienvenue, <em style={styles.rouge}>{name}.</em>
      </Text>
      <Text style={styles.body}>
        Ravis de vous compter parmi les nôtres. Vous trouverez dans votre espace
        client l&apos;historique de vos commandes, votre liste d&apos;envies et
        vos préférences de communication.
      </Text>
      <Button href={`${storefront_url}/fr/store`} style={styles.button}>
        Explorer la boutique
      </Button>
      <Text style={{ ...styles.body, marginTop: 24 }}>
        Quelques précisions sur notre maison : nous travaillons exclusivement
        avec six éleveurs partenaires de race basque, dans un rayon de 80 km
        autour de l&apos;atelier. Pas de nitrite, jamais. Affinage minimum 12
        mois pour les jambons. Le reste, vous le découvrirez à la dégustation.
      </Text>
    </EmailLayout>
  )
}
