import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface OrderShippedEmailProps {
  customer_name?: string | null
  order_display_id: string | number
  carrier: string
  tracking_number?: string | null
  tracking_url?: string | null
  storefront_url: string
}

export default function OrderShippedEmail({
  customer_name,
  order_display_id,
  carrier,
  tracking_number,
  tracking_url,
  storefront_url,
}: OrderShippedEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview={`Votre commande #${order_display_id} est en route.`}>
      <Text style={styles.mono}>EXPÉDITION · #{order_display_id}</Text>
      <Text style={styles.h1}>
        En route, <em style={styles.rouge}>{name}.</em>
      </Text>
      <Text style={styles.body}>
        Votre commande vient de quitter notre atelier en{" "}
        <strong>{carrier}</strong>
        {tracking_number ? (
          <>
            . Numéro de suivi : <strong>{tracking_number}</strong>
          </>
        ) : null}
        .
      </Text>
      <Text style={styles.body}>
        Si vous avez choisi la livraison <strong>Chronofresh</strong>, votre
        colis voyage en chaîne du froid. Réceptionnez-le sans tarder et placez
        son contenu au frais immédiatement.
      </Text>
      <Button
        href={tracking_url ?? `${storefront_url}/fr/account/orders`}
        style={styles.button}
      >
        Suivre la livraison
      </Button>
    </EmailLayout>
  )
}
