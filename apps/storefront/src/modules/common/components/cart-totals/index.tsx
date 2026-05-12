"use client"

import { convertToLocale } from "@lib/util/money"
import {
  freeShippingApplies,
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
  // 0.055 → "5,5 %"; 0.2 → "20 %".
  const pct = (rate * 100).toFixed(rate === Math.round(rate) ? 0 : 1)
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
  const subtotalCents = item_subtotal ?? 0
  const threshold = freeShippingThresholdCents()
  const fsApplies = freeShippingApplies({ item_subtotal: subtotalCents })
  const remainingToFreeShip = Math.max(0, threshold - subtotalCents)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Sous-total (hors livraison)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Livraison</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {fsApplies && (shipping_subtotal ?? 0) === 0
              ? "Offerte"
              : convertToLocale({
                  amount: shipping_subtotal ?? 0,
                  currency_code,
                })}
          </span>
        </div>
        {!fsApplies && remainingToFreeShip > 0 ? (
          <div className="text-xs text-ui-fg-muted italic">
            Plus que{" "}
            {convertToLocale({
              amount: remainingToFreeShip,
              currency_code,
            })}{" "}
            pour la livraison offerte.
          </div>
        ) : null}
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Promotion</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        {showSplitVat ? (
          <div
            className="flex flex-col gap-y-1"
            data-testid="cart-vat-breakdown"
          >
            {vatRows.map((row) => (
              <div
                key={row.rate}
                className="flex justify-between text-xs text-ui-fg-muted"
              >
                <span>dont TVA {formatRate(row.rate)}</span>
                <span data-rate={row.rate}>
                  {convertToLocale({ amount: row.amount, currency_code })}
                </span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Total TVA</span>
              <span data-testid="cart-taxes" data-value={tax_total || 0}>
                {convertToLocale({ amount: tax_total ?? 0, currency_code })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between">
            <span>TVA</span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
