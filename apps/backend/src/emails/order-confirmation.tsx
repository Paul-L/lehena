import { Button, Hr, Section, Text } from "@react-email/components"
import React from "react"

import { BRAND_COLORS, EmailLayout, styles } from "./layout"

export interface OrderConfirmationEmailProps {
  customer_name?: string | null
  order_display_id: string | number
  storefront_url: string
  /** Cents amounts, formatted in the helper. */
  items: { title: string; quantity: number; total: number }[]
  subtotal: number
  shipping_total: number
  tax_total: number
  total: number
  currency_code: string
  shipping_eta?: string | null
  tracking_url?: string | null
}

const formatMoney = (cents: number, currency: string) =>
  `${(cents / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`

export default function OrderConfirmationEmail({
  customer_name,
  order_display_id,
  storefront_url,
  items,
  subtotal,
  shipping_total,
  tax_total,
  total,
  currency_code,
  shipping_eta,
  tracking_url,
}: OrderConfirmationEmailProps) {
  const name = customer_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview={`Commande #${order_display_id} confirmée — merci.`}>
      <Text style={styles.mono}>COMMANDE #{order_display_id}</Text>
      <Text style={styles.h1}>
        Merci, <em style={styles.rouge}>{name}.</em>
      </Text>
      <Text style={styles.body}>
        Votre commande est confirmée et notre atelier la prépare déjà. Vous
        recevrez un email dès qu&apos;elle sera expédiée.
      </Text>

      {shipping_eta ? (
        <Text
          style={{
            ...styles.body,
            backgroundColor: BRAND_COLORS.paperElevated,
            padding: "12px 14px",
            border: `1px solid ${BRAND_COLORS.line}`,
            borderLeft: `3px solid ${BRAND_COLORS.rouge}`,
            margin: "16px 0",
          }}
        >
          <strong>Livraison estimée :</strong> {shipping_eta}
        </Text>
      ) : null}

      <Text style={styles.h2}>Récapitulatif</Text>
      <Section>
        {items.map((it, idx) => (
          <Text
            key={idx}
            style={{
              ...styles.body,
              margin: 0,
              padding: "8px 0",
              borderBottom: `1px solid ${BRAND_COLORS.line}`,
              display: "block",
            }}
          >
            <span style={{ float: "right" }}>
              {formatMoney(it.total, currency_code)}
            </span>
            <strong>{it.title}</strong> &times; {it.quantity}
          </Text>
        ))}
      </Section>

      <Section style={{ marginTop: 16 }}>
        <Text style={{ ...styles.body, margin: 0 }}>
          <span style={{ float: "right" }}>
            {formatMoney(subtotal, currency_code)}
          </span>
          Sous-total
        </Text>
        <Text style={{ ...styles.body, margin: 0 }}>
          <span style={{ float: "right" }}>
            {shipping_total === 0
              ? "Offerte"
              : formatMoney(shipping_total, currency_code)}
          </span>
          Livraison
        </Text>
        <Text style={{ ...styles.body, margin: 0 }}>
          <span style={{ float: "right" }}>
            {formatMoney(tax_total, currency_code)}
          </span>
          TVA
        </Text>
        <Hr style={{ borderColor: BRAND_COLORS.ink, margin: "10px 0" }} />
        <Text style={{ ...styles.body, margin: 0, fontWeight: 600 }}>
          <span style={{ float: "right" }}>
            {formatMoney(total, currency_code)}
          </span>
          Total TTC
        </Text>
      </Section>

      <Section style={{ marginTop: 28 }}>
        <Button
          href={tracking_url ?? `${storefront_url}/fr/account/orders`}
          style={styles.button}
        >
          Suivre ma commande
        </Button>
      </Section>
    </EmailLayout>
  )
}
