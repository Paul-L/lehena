"use client"

import { convertToLocale } from "@lib/util/money"
import {
  freeShippingThresholdCents,
  vatBreakdown,
} from "@lib/util/shipping-rules"
import React from "react"

interface CartTotalsProps {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    /**
     * Optional — if present, we group the line items' tax_lines by rate and
     * render a detailed "TVA 5,5 % / 20 %" split. Pass the cart's items.
     */
    items?:
      | {
          tax_lines?:
            | {
                rate?: number | string | null
                total?: number | string | null
              }[]
            | null
        }[]
      | null
  }
}

const formatRate = (rate: number) => {
  // Medusa exposes the tax rate already as a percentage (5.5, 20) — NOT a
  // fraction. Do not multiply by 100 (that produced "550 %").
  const pct = Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(1)
  return `${pct.replace(".", ",")} %`
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
    items,
  } = totals

  const vatRows = items ? vatBreakdown({ items }) : []
  const showSplitVat = vatRows.length > 0

  // Free-shipping copy: shown until the customer crosses the threshold.
  // Cart amounts are in major units (euros); the threshold helper returns
  // cents, so convert to euros before comparing (avoids the "4 990,50 €" bug).
  const subtotalEur = item_subtotal ?? 0
  const thresholdEur = freeShippingThresholdCents() / 100
  const fsApplies = subtotalEur >= thresholdEur
  const remainingToFreeShip = Math.max(0, thresholdEur - subtotalEur)

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "var(--serif)",
    fontSize: 14,
    color: "var(--ink-soft)",
    padding: "5px 0",
  }
  const subRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: "0.04em",
    color: "var(--ink-mute)",
    padding: "2px 0",
  }

  return (
    <div>
      <div style={rowStyle}>
        <span>Sous-total (hors livraison)</span>
        <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
          {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
        </span>
      </div>
      <div style={rowStyle}>
        <span>Livraison</span>
        <span
          data-testid="cart-shipping"
          data-value={shipping_subtotal || 0}
          style={{
            color:
              fsApplies && (shipping_subtotal ?? 0) === 0
                ? "var(--olive)"
                : "var(--ink-soft)",
          }}
        >
          {fsApplies && (shipping_subtotal ?? 0) === 0
            ? "Offerte"
            : convertToLocale({
                amount: shipping_subtotal ?? 0,
                currency_code,
              })}
        </span>
      </div>
      {!fsApplies && remainingToFreeShip > 0 ? (
        <div
          style={{
            fontFamily: "var(--serif)",
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ink-mute)",
            padding: "2px 0",
          }}
        >
          Plus que{" "}
          {convertToLocale({ amount: remainingToFreeShip, currency_code })} pour
          la livraison offerte.
        </div>
      ) : null}
      {!!discount_subtotal && (
        <div style={rowStyle}>
          <span>Promotion</span>
          <span
            data-testid="cart-discount"
            data-value={discount_subtotal || 0}
            style={{ color: "var(--olive)" }}
          >
            −{" "}
            {convertToLocale({ amount: discount_subtotal ?? 0, currency_code })}
          </span>
        </div>
      )}
      {showSplitVat ? (
        <div data-testid="cart-vat-breakdown">
          {vatRows.map((row) => (
            <div key={row.rate} style={subRowStyle}>
              <span>dont TVA {formatRate(row.rate)}</span>
              <span data-rate={row.rate}>
                {convertToLocale({ amount: row.amount, currency_code })}
              </span>
            </div>
          ))}
          <div style={rowStyle}>
            <span>Total TVA</span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        </div>
      ) : (
        <div style={rowStyle}>
          <span>TVA</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code })}
          </span>
        </div>
      )}
      <div className="hr-strong" style={{ margin: "14px 0" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span className="eyebrow">Total TTC</span>
        <span
          className="serif-display"
          style={{ fontSize: 30 }}
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
    </div>
  )
}

export default CartTotals
