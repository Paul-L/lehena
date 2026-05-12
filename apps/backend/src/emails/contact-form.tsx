import { Text } from "@react-email/components"
import React from "react"

import { BRAND_COLORS, EmailLayout, styles } from "./layout"

export interface ContactFormEmailProps {
  sender_name: string
  sender_email: string
  subject: string
  message: string
}

/**
 * Internal-only email forwarded to contact@lehena.fr when the storefront
 * contact form is submitted. The sender's email is set as reply-to so the
 * agent can reply directly.
 */
export default function ContactFormEmail({
  sender_name,
  sender_email,
  subject,
  message,
}: ContactFormEmailProps) {
  return (
    <EmailLayout preview={`Nouveau message contact : ${subject}`}>
      <Text style={styles.mono}>NOUVEAU MESSAGE CONTACT</Text>
      <Text style={styles.h1}>{subject}</Text>
      <Text style={{ ...styles.body, margin: 0 }}>
        <strong>De :</strong> {sender_name} &lt;{sender_email}&gt;
      </Text>
      <Text
        style={{
          ...styles.body,
          backgroundColor: BRAND_COLORS.paperElevated,
          padding: 16,
          border: `1px solid ${BRAND_COLORS.line}`,
          whiteSpace: "pre-wrap",
          marginTop: 16,
        }}
      >
        {message}
      </Text>
    </EmailLayout>
  )
}
