import { Button, Text } from "@react-email/components"
import React from "react"

import { EmailLayout, styles } from "./layout"

export interface MigrationWelcomeEmailProps {
  first_name?: string | null
  reset_url: string
}

/**
 * One-shot mail sent to legacy WP customers when their account is brought
 * into the new site. The reset link is a 30-day signed JWT so they have
 * time to act — longer than the standard 15-minute reset because we don't
 * want anyone to feel locked out during the bascule weekend.
 */
export default function MigrationWelcomeEmail({
  first_name,
  reset_url,
}: MigrationWelcomeEmailProps) {
  const name = first_name?.trim() || "Bonjour"
  return (
    <EmailLayout preview="Votre compte Lehena vous attend — choisissez un nouveau mot de passe.">
      <Text style={styles.mono}>NOUVEAU SITE</Text>
      <Text style={styles.h1}>
        Bienvenue dans le <em style={styles.rouge}>nouveau Lehena, {name}.</em>
      </Text>
      <Text style={styles.body}>
        Nous avons refondu entièrement le site de la maison Lehena. Votre compte
        historique a été préservé : nous y avons importé votre profil, vos
        adresses et vos préférences.
      </Text>
      <Text style={styles.body}>
        Pour des raisons de sécurité, votre mot de passe n&apos;a pas pu être
        repris à l&apos;identique. Cliquez sur le bouton ci-dessous pour en
        choisir un nouveau — le lien est valable <strong>30 jours</strong>.
      </Text>
      <Button href={reset_url} style={styles.button}>
        Choisir mon nouveau mot de passe
      </Button>
      <Text style={{ ...styles.body, marginTop: 24 }}>
        Une fois connecté, vous retrouverez votre liste d&apos;envies, vos
        adresses et vos commandes passées. Si vous rencontrez le moindre souci,
        écrivez-nous à <a href="mailto:contact@lehena.fr">contact@lehena.fr</a>{" "}
        — l&apos;équipe répond en moins de 48 h ouvrées.
      </Text>
      <Text style={styles.small}>
        Vous recevez cet email parce que votre adresse est associée à un compte
        client sur l&apos;ancien lehena.fr. Si ce n&apos;est pas votre cas,
        ignorez cet email.
      </Text>
    </EmailLayout>
  )
}
