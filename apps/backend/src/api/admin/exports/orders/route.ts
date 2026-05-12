import {
  type AuthenticatedMedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { type ExportOrdersSchema } from "./validators"

/**
 * Generates a CSV export of orders in the date range, with French
 * accounting columns. Returns the file inline (the admin UI downloads it
 * directly) — no S3 round-trip for V1.
 *
 * CSV format: `;` separator, `,` decimal, BOM prefix so Excel FR opens
 * UTF-8 cleanly. Money columns are in cents-as-integer; the front-end
 * adds the comma decimal at display time.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<ExportOrdersSchema>,
  res: MedusaResponse
) {
  const { from, to, status } = req.validatedBody
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid from/to date."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "created_at",
      "currency_code",
      "item_subtotal",
      "shipping_subtotal",
      "tax_total",
      "total",
      "items.title",
      "items.product_title",
      "items.quantity",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "payment_collections.payment_sessions.provider_id",
    ],
    filters: {
      created_at: { $gte: fromDate, $lt: toDate },
      ...(status && status.length > 0 ? { status } : {}),
    },
  })

  const lines: string[] = []
  lines.push(
    [
      "Date",
      "N° commande",
      "Client",
      "Email",
      "Statut",
      "Articles",
      "Total HT",
      "TVA",
      "Livraison",
      "Total TTC",
      "Devise",
      "Mode paiement",
    ]
      .map(csv)
      .join(";")
  )

  interface OrderRow {
    id: string
    display_id?: number | null
    email?: string | null
    status?: string | null
    created_at?: string | Date | null
    currency_code?: string | null
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    tax_total?: number | null
    total?: number | null
    items?: {
      product_title?: string | null
      title?: string | null
      quantity?: number
    }[]
    shipping_address?: {
      first_name?: string | null
      last_name?: string | null
    } | null
    payment_collections?: {
      payment_sessions?: { provider_id?: string | null }[]
    }[]
  }

  for (const o of (orders ?? []) as OrderRow[]) {
    const itemsSummary = (o.items ?? [])
      .map(
        (it) => `${it.product_title ?? it.title ?? "?"} × ${it.quantity ?? 1}`
      )
      .join(" | ")
    const customer = [
      o.shipping_address?.first_name,
      o.shipping_address?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
    const paymentProvider =
      o.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ?? ""
    const subtotal = (o.item_subtotal ?? 0) - (o.tax_total ?? 0)
    lines.push(
      [
        o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "",
        String(o.display_id ?? o.id),
        customer,
        o.email ?? "",
        o.status ?? "",
        itemsSummary,
        formatCents(subtotal),
        formatCents(o.tax_total ?? 0),
        formatCents(o.shipping_subtotal ?? 0),
        formatCents(o.total ?? 0),
        (o.currency_code ?? "EUR").toUpperCase(),
        paymentProvider,
      ]
        .map(csv)
        .join(";")
    )
  }

  // BOM so Excel FR picks UTF-8 correctly.
  const body = "﻿" + lines.join("\r\n")
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="lehena-orders-${from}_${to}.csv"`
  )
  return res.send(body)
}

function csv(field: string | number): string {
  const s = String(field)
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatCents(cents: number): string {
  // FR Excel: 1 234,56 (no thousands separator to keep things simple).
  return (cents / 100).toFixed(2).replace(".", ",")
}
