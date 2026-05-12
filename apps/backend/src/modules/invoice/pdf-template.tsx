/**
 * @react-pdf/renderer is ESM-only. We dynamic-import it at render time so
 * CommonJS compilation (Medusa's default) doesn't choke. The component
 * itself is a plain JSX function the dynamic loader will receive.
 */
import React from "react"

interface InvoiceLineItem {
  title: string
  quantity: number
  unit_price: number
  total: number
}

export interface InvoiceData {
  number: string
  issued_at: string
  order_display_id: number | string | null
  customer: {
    first_name: string | null
    last_name: string | null
    email: string
  }
  billing_address: {
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    postal_code?: string | null
    province?: string | null
    country_code?: string | null
  } | null
  items: InvoiceLineItem[]
  subtotal: number
  shipping_total: number
  tax_total: number
  total: number
  currency_code: string
}

const COMPANY = {
  name: "Maison Lehena SAS",
  address: "1 rue du Marché",
  postal_city: "64200 Biarritz",
  country: "France",
  siret: "RCS Bayonne 123 456 789",
  vat: "FR12345678901",
  contact: "contact@lehena.com",
}

const formatMoney = (cents: number, currency: string) => {
  const value = (cents / 100).toFixed(2).replace(".", ",")
  return `${value} ${currency.toUpperCase()}`
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  // Dynamic import keeps the ESM-only @react-pdf/renderer out of the
  // CommonJS module graph at compile time.
  const pdf = await import("@react-pdf/renderer")
  const { Document, Page, Text, View, StyleSheet, renderToBuffer } = pdf

  const styles = StyleSheet.create({
    page: {
      padding: 48,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: "#2a1f17",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
    small: { fontSize: 9, color: "#6b6157" },
    block: { marginBottom: 18 },
    row: {
      flexDirection: "row",
      paddingVertical: 4,
      borderBottom: "1pt solid #e7e1d5",
    },
    rowHead: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottom: "1pt solid #2a1f17",
      fontFamily: "Helvetica-Bold",
    },
    cellLabel: { flex: 5 },
    cellQty: { flex: 1, textAlign: "right" },
    cellUnit: { flex: 2, textAlign: "right" },
    cellTotal: { flex: 2, textAlign: "right" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalRowBold: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderTop: "1pt solid #2a1f17",
      fontFamily: "Helvetica-Bold",
      fontSize: 11,
    },
    footer: {
      position: "absolute",
      bottom: 36,
      left: 48,
      right: 48,
      fontSize: 8,
      color: "#6b6157",
      textAlign: "center",
      borderTop: "1pt solid #e7e1d5",
      paddingTop: 8,
    },
  })

  const customerName = [data.customer.first_name, data.customer.last_name]
    .filter(Boolean)
    .join(" ")
  const addr = data.billing_address

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{COMPANY.name}</Text>
            <Text style={styles.small}>{COMPANY.address}</Text>
            <Text style={styles.small}>{COMPANY.postal_city}</Text>
            <Text style={styles.small}>{COMPANY.country}</Text>
            <Text style={styles.small}>{COMPANY.contact}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>
              Facture {data.number}
            </Text>
            <Text style={styles.small}>
              Émise le {formatDate(data.issued_at)}
            </Text>
            {data.order_display_id != null && (
              <Text style={styles.small}>
                Commande #{data.order_display_id}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
            Facturer à
          </Text>
          <Text>{customerName || data.customer.email}</Text>
          <Text style={styles.small}>{data.customer.email}</Text>
          {addr ? (
            <>
              {addr.address_1 ? (
                <Text style={styles.small}>{addr.address_1}</Text>
              ) : null}
              {addr.address_2 ? (
                <Text style={styles.small}>{addr.address_2}</Text>
              ) : null}
              <Text style={styles.small}>
                {[addr.postal_code, addr.city].filter(Boolean).join(" ")}
                {addr.country_code
                  ? `, ${addr.country_code.toUpperCase()}`
                  : ""}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.rowHead}>
          <Text style={styles.cellLabel}>Article</Text>
          <Text style={styles.cellQty}>Qté</Text>
          <Text style={styles.cellUnit}>Prix unit.</Text>
          <Text style={styles.cellTotal}>Total</Text>
        </View>
        {data.items.map((it, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.cellLabel}>{it.title}</Text>
            <Text style={styles.cellQty}>{it.quantity}</Text>
            <Text style={styles.cellUnit}>
              {formatMoney(it.unit_price, data.currency_code)}
            </Text>
            <Text style={styles.cellTotal}>
              {formatMoney(it.total, data.currency_code)}
            </Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total</Text>
            <Text>{formatMoney(data.subtotal, data.currency_code)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Livraison</Text>
            <Text>{formatMoney(data.shipping_total, data.currency_code)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA</Text>
            <Text>{formatMoney(data.tax_total, data.currency_code)}</Text>
          </View>
          <View style={styles.totalRowBold}>
            <Text>Total TTC</Text>
            <Text>{formatMoney(data.total, data.currency_code)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {COMPANY.name} — {COMPANY.siret} — TVA {COMPANY.vat}.{"\n"}
          TVA acquittée selon le régime des débits. Conformément à
          l&apos;article L.441-10 du code de commerce : pas d&apos;escompte en
          cas de paiement anticipé. Pénalités de retard : 3 fois le taux
          d&apos;intérêt légal. Indemnité forfaitaire pour frais de recouvrement
          : 40 €.
        </Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc) as Promise<Buffer>
}
