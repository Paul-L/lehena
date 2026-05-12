import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface ReviewRequestEmailProps {
  customer_name?: string | null
  order_display_id: string | number
  storefront_url: string
}

/**
 * Sent J+10 after delivery. We point at the order detail page rather
 * than at an external Trustpilot link in V1 — the internal review module
 * lands in Phase 10. Once it ships, swap the CTA target to the in-app
 * review form.
 */
export default function ReviewRequestEmail({
  customer_name,
  order_display_id,
  storefront_url,
}: ReviewRequestEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout
      preview="Une petite minute pour partager votre avis ?"
      marketing
      unsubscribeUrl={`${storefront_url}/fr/preferences`}
    >
      <Text style={styles.mono}>VOTRE AVIS · #{order_display_id}</Text>
      <Text style={styles.h1}>
        Dix jours plus tard, <em style={styles.rouge}>{name}.</em>
      </Text>
      <Text style={styles.body}>
        Votre commande est arrivée chez vous il y a une dizaine de jours. Vous
        avez eu le temps de découvrir notre travail — quelques lignes sur ce que
        vous en avez pensé nous aideraient énormément.
      </Text>
      <Text style={styles.body}>
        Les avis honnêtes guident les nouveaux clients vers les bons produits,
        et nous indiquent ce que nous pouvons améliorer.
      </Text>
      <Button
        href={`${storefront_url}/fr/account/orders/details/${order_display_id}`}
        style={styles.button}
      >
        Laisser un avis
      </Button>
      <Text style={{ ...styles.small, marginTop: 24 }}>
        Cela vous prendra deux minutes, c&apos;est promis. Et si quelque chose
        ne s&apos;est pas passé comme prévu — répondez directement à cet email,
        l&apos;équipe lit chaque réponse.
      </Text>
    </EmailLayout>
  )
}
