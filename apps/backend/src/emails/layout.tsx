import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import React from "react"

import { COMPANY, addressLine, siretTvaFooterLine } from "../lib/company"

interface Props {
  /** Pre-header text shown in inbox previews. Keep under 90 chars. */
  preview: string
  /** Optional storefront URL override for the unsubscribe link. */
  unsubscribeUrl?: string | null
  /** True for marketing emails — adds the unsubscribe footer. */
  marketing?: boolean
  children: React.ReactNode
}

const BRAND = {
  ink: "#2a1f17",
  rouge: "#b3402a",
  paper: "#fbf7ee",
  paperElevated: "#f5efe1",
  inkMute: "#6b6157",
  line: "#e7e1d5",
  /**
   * URL du logo email. Doit être un PNG hébergé publiquement (les SVG inline
   * ou embarqués sont mal supportés par Outlook / anciens clients).
   * Si absent, on retombe sur un wordmark texte élégant en fallback pour
   * éviter les images 404 dans les boîtes des destinataires.
   */
  logoUrl: process.env.LEHENA_EMAIL_LOGO_URL ?? null,
}

/**
 * Shared layout for every Lehena email. Styles are inline (constructed via
 * style objects React Email serialises) so they survive Gmail / Outlook /
 * Apple Mail dark mode without depending on Tailwind classes.
 *
 * Marketing footer (unsubscribe + reason link) is only rendered when
 * `marketing` is true — transactional emails (order, password reset, etc.)
 * are exempt from CAN-SPAM / RGPD unsubscribe requirements but still carry
 * the company address.
 */
export function EmailLayout({
  preview,
  children,
  marketing = false,
  unsubscribeUrl = null,
}: Props) {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="color-scheme" content="light only" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: BRAND.paper,
          color: BRAND.ink,
          fontFamily: 'Georgia, "Times New Roman", "Liberation Serif", serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            maxWidth: 600,
            margin: "0 auto",
            padding: "32px 32px 48px",
            border: `1px solid ${BRAND.line}`,
          }}
        >
          <Section style={{ paddingBottom: 24 }}>
            <Link
              href="https://lehena.fr"
              style={{ textDecoration: "none", color: BRAND.ink }}
            >
              {BRAND.logoUrl ? (
                <Img
                  src={BRAND.logoUrl}
                  alt="Maison Lehena"
                  width={120}
                  height={40}
                  style={{ display: "block" }}
                />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 22,
                    letterSpacing: "0.05em",
                    color: BRAND.ink,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Maison <em style={{ color: BRAND.rouge }}>Lehena</em>
                </Text>
              )}
            </Link>
          </Section>

          <Section>{children}</Section>

          <Hr
            style={{
              borderColor: BRAND.line,
              borderWidth: 1,
              marginTop: 36,
              marginBottom: 18,
            }}
          />

          <Section>
            <Text
              style={{
                fontSize: 11,
                color: BRAND.inkMute,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {addressLine()}
              <br />
              {siretTvaFooterLine()}
              <br />
              <Link
                href="https://lehena.fr"
                style={{ color: BRAND.inkMute, textDecoration: "underline" }}
              >
                lehena.fr
              </Link>{" "}
              ·{" "}
              <Link
                href={`mailto:${COMPANY.email}`}
                style={{ color: BRAND.inkMute, textDecoration: "underline" }}
              >
                {COMPANY.email}
              </Link>
            </Text>
            {marketing && unsubscribeUrl ? (
              <Text
                style={{
                  fontSize: 11,
                  color: BRAND.inkMute,
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Vous recevez cet email parce que vous êtes abonné à notre
                newsletter.{" "}
                <Link
                  href={unsubscribeUrl}
                  style={{ color: BRAND.inkMute, textDecoration: "underline" }}
                >
                  Se désinscrire
                </Link>
                .
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const styles = {
  h1: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 28,
    lineHeight: 1.15,
    color: BRAND.ink,
    margin: "0 0 12px",
    fontWeight: 400,
  },
  h2: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 18,
    lineHeight: 1.25,
    color: BRAND.ink,
    margin: "24px 0 8px",
    fontWeight: 600,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.6,
    color: BRAND.ink,
    margin: "0 0 16px",
  },
  small: {
    fontSize: 12,
    lineHeight: 1.5,
    color: BRAND.inkMute,
    margin: "0 0 8px",
  },
  mono: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: BRAND.inkMute,
    margin: "0 0 8px",
  },
  button: {
    display: "inline-block",
    padding: "14px 28px",
    backgroundColor: BRAND.ink,
    color: "#ffffff",
    textDecoration: "none",
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    fontWeight: 500,
  },
  rouge: { color: BRAND.rouge },
}

export const BRAND_COLORS = BRAND
