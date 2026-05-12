import { Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface InvoiceEmailProps {
  customer_name?: string | null
  invoice_number: string
  order_display_id: string | number
}

export default function InvoiceEmail({
  customer_name,
  invoice_number,
  order_display_id,
}: InvoiceEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview={`Votre facture ${invoice_number} est jointe.`}>
      <Text style={styles.mono}>FACTURE {invoice_number}</Text>
      <Text style={styles.h1}>
        Votre <em style={styles.rouge}>facture, {name}.</em>
      </Text>
      <Text style={styles.body}>
        Vous trouverez en pièce jointe la facture de votre commande{" "}
        <strong>#{order_display_id}</strong>. Conservez-la pour vos archives —
        elle est également accessible à tout moment depuis votre espace client.
      </Text>
      <Text style={styles.small}>
        Maison Lehena SAS — RCS Bayonne 123 456 789 — TVA FR12345678901.
      </Text>
    </EmailLayout>
  )
}
