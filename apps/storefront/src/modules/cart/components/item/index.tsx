"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { type HttpTypes } from "@medusajs/types"
import GiftMessage from "@modules/cart/components/gift-message"
import ErrorMessage from "@modules/checkout/components/error-message"
import { LhClose, LhMinus, LhPlus } from "@modules/common/components/lehena/icons"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

interface ItemProps {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1) return
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const remove = async () => {
    setError(null)
    setUpdating(true)
    await deleteLineItem(item.id)
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const lineTotal = convertToLocale({
    amount: item.total ?? 0,
    currency_code: currencyCode,
  })
  const unitPrice = convertToLocale({
    amount: (item.total ?? 0) / (item.quantity || 1),
    currency_code: currencyCode,
  })

  // ─── Compact preview (checkout recap) ───
  if (type === "preview") {
    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "14px 0",
          borderBottom: "1px solid var(--line)",
        }}
        data-testid="product-row"
      >
        <div style={{ width: 52, height: 52, flexShrink: 0, position: "relative" }}>
          <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
          <span
            style={{
              position: "absolute",
              top: -7,
              right: -7,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 11,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--mono)",
            }}
          >
            {item.quantity}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif-display" style={{ fontSize: 15, lineHeight: 1.15 }} data-testid="product-title">
            {item.product_title}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        </div>
        <div className="serif" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
          {lineTotal}
        </div>
      </div>
    )
  }

  // ─── Full cart row (maquette style) ───
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "20px 0",
        borderBottom: "1px solid var(--line)",
      }}
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        style={{ width: 88, flexShrink: 0 }}
      >
        <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
      </LocalizedClientLink>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div className="serif-display" style={{ fontSize: 18, lineHeight: 1.2 }} data-testid="product-title">
            {item.product_title}
          </div>
          <button
            onClick={remove}
            aria-label="Retirer"
            data-testid="product-delete-button"
            style={{ color: "var(--ink-mute)", flexShrink: 0 }}
          >
            <LhClose size={16} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)", margin: "4px 0 12px" }}>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--line-strong)",
              borderRadius: 999,
            }}
          >
            <button
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              aria-label="Diminuer la quantité"
              data-testid="product-decrease-button"
              style={{ width: 32, height: 32, display: "grid", placeItems: "center", opacity: item.quantity <= 1 ? 0.4 : 1 }}
            >
              <LhMinus />
            </button>
            <span style={{ width: 30, textAlign: "center", fontFamily: "var(--mono)", fontSize: 13 }} data-testid="product-quantity">
              {updating ? <Spinner /> : item.quantity}
            </span>
            <button
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating}
              aria-label="Augmenter la quantité"
              data-testid="product-increase-button"
              style={{ width: 32, height: 32, display: "grid", placeItems: "center" }}
            >
              <LhPlus />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            {item.quantity > 1 && (
              <span style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "var(--mono)" }}>
                {unitPrice} × {item.quantity}
              </span>
            )}
            <span className="serif" style={{ fontSize: 18 }} data-testid="product-price">
              {lineTotal}
            </span>
          </div>
        </div>

        <GiftMessage
          lineId={item.id}
          initial={
            typeof item.metadata?.gift_message === "string"
              ? (item.metadata.gift_message as string)
              : null
          }
          type={type}
        />
        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </div>
  )
}

export default Item
