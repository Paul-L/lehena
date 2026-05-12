import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface OrderDeliveredEmailProps {
  customer_name?: string | null
  order_display_id: string | number
  storefront_url: string
}

export default function OrderDeliveredEmail({
  customer_name,
  order_display_id,
  storefront_url,
}: OrderDeliveredEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview="Votre commande Lehena est arrivée — votre avis ?">
      <Text style={styles.mono}>LIVRÉE · #{order_display_id}</Text>
      <Text style={styles.h1}>
        Bonne <em style={styles.rouge}>dégustation, {name}.</em>
      </Text>
      <Text style={styles.body}>
        Votre commande a été livrée. Quelques recommandations pour profiter au
        mieux :
      </Text>
      <Text style={styles.body}>
        — Sortir les charcuteries du froid 30 minutes avant de les déguster. Les
        arômes s&apos;ouvrent à 18 °C.
        <br />
        — Un jambon Orhi se conserve jusqu&apos;à 3 mois après ouverture
        s&apos;il est enveloppé d&apos;un linge propre et stocké à 14-16 °C.
        <br />— Les saucissons préfèrent un environnement légèrement frais et
        sec.
      </Text>
      <Text style={styles.body}>
        Quand vous serez prêt à partager votre expérience, votre avis nous
        aidera énormément.
      </Text>
      <Button
        href={`${storefront_url}/fr/account/orders`}
        style={styles.button}
      >
        Laisser un avis
      </Button>
    </EmailLayout>
  )
}
