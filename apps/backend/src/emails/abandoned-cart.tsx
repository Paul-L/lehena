import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface AbandonedCartEmailProps {
  customer_name?: string | null
  /** "J+1" or "J+3" — drives the copy. */
  reminder_stage: "J+1" | "J+3"
  /** Top items left in the cart, max 3. */
  items: { title: string; thumbnail?: string | null }[]
  cart_url: string
  unsubscribe_url: string
}

export default function AbandonedCartEmail({
  customer_name,
  reminder_stage,
  items,
  cart_url,
  unsubscribe_url,
}: AbandonedCartEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  const headline =
    reminder_stage === "J+1"
      ? "Votre panier vous attend."
      : "Une dernière pensée pour votre panier ?"
  return (
    <EmailLayout
      preview={`Votre sélection chez Lehena est toujours là.`}
      marketing
      unsubscribeUrl={unsubscribe_url}
    >
      <Text style={styles.mono}>RAPPEL</Text>
      <Text style={styles.h1}>
        {name}, <em style={styles.rouge}>{headline}</em>
      </Text>
      <Text style={styles.body}>
        Nous avons gardé votre sélection en mémoire. Vous pouvez la finaliser en
        un clic.
      </Text>
      {items.length > 0 ? (
        <Text style={styles.body}>
          <strong>Dans votre panier :</strong>
          <br />
          {items
            .slice(0, 3)
            .map((it) => `· ${it.title}`)
            .join("\n")}
        </Text>
      ) : null}
      <Button href={cart_url} style={styles.button}>
        Reprendre ma commande
      </Button>
      {reminder_stage === "J+3" ? (
        <Text style={{ ...styles.small, marginTop: 24 }}>
          Si vous avez changé d&apos;avis, aucun souci — vous ne recevrez plus
          de rappel pour ce panier.
        </Text>
      ) : null}
    </EmailLayout>
  )
}
