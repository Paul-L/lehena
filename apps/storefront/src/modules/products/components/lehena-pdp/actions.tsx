"use client"

import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { LhCheck, LhMinus, LhPlus } from "@modules/common/components/lehena/icons"
import { useCartDrawer } from "@modules/layout/components/cart-drawer/cart-drawer-context"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function LehenaProductActions({ product, region }: Props) {
  const { setOpen } = useCartDrawer()
  const countryCode = useParams().countryCode as string

  const variants = product.variants ?? []
  const hasMultipleVariants = variants.length > 1
  const primaryOption = product.options?.[0]

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => {
      if (!hasMultipleVariants && variants[0]?.id) return variants[0].id
      return null
    }
  )
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If only one variant, auto-pick.
  useEffect(() => {
    if (!hasMultipleVariants && variants[0]?.id) {
      setSelectedVariantId(variants[0].id)
    }
  }, [hasMultipleVariants, variants])

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return undefined
    return variants.find((v) => v.id === selectedVariantId)
  }, [variants, selectedVariantId])

  const inStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    if (selectedVariant.allow_backorder) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant])

  const variantPrice = (variant?: HttpTypes.StoreProductVariant) => {
    const v = variant as any
    return v?.calculated_price?.calculated_amount ?? null
  }
  const variantCurrency = (variant?: HttpTypes.StoreProductVariant) => {
    const v = variant as any
    return v?.calculated_price?.currency_code ?? region.currency_code
  }

  const cheapest = variants
    .map((v) => variantPrice(v))
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => a - b)[0]

  const selectedPrice = variantPrice(selectedVariant) ?? cheapest ?? 0
  const currency = variantCurrency(selectedVariant)

  const handleAdd = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    setError(null)
    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: qty,
        countryCode,
      })
      setOpen(true)
    } catch (e: any) {
      setError(e?.message || "Impossible d'ajouter au panier")
    } finally {
      setIsAdding(false)
    }
  }

  const variantsCols = Math.min(variants.length, 3)
  const totalPrice = selectedPrice * qty

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 32,
          paddingBottom: 28,
          borderBottom: "1px solid var(--line-strong)",
        }}
      >
        <span className="serif-display" style={{ fontSize: 44, lineHeight: 1 }}>
          {convertToLocale({ amount: selectedPrice, currency_code: currency })}
        </span>
        {selectedVariant?.title && selectedVariant.title !== "Default" && (
          <span className="mono" style={{ color: "var(--ink-mute)" }}>
            {selectedVariant.title}
          </span>
        )}
      </div>

      {hasMultipleVariants && primaryOption && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
              alignItems: "baseline",
            }}
          >
            <div className="eyebrow">{primaryOption.title || "Format"}</div>
            {selectedVariant?.title && selectedVariant.title !== "Default" && (
              <div
                className="serif"
                style={{
                  fontStyle: "italic",
                  color: "var(--ink-mute)",
                  fontSize: 14,
                }}
              >
                {selectedVariant.title}
              </div>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${variantsCols}, 1fr)`,
              gap: 8,
            }}
          >
            {variants.map((v) => {
              const isSelected = v.id === selectedVariantId
              const price = variantPrice(v)
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id ?? null)}
                  style={{
                    padding: "16px 12px",
                    border: isSelected
                      ? "2px solid var(--ink)"
                      : "1px solid var(--line-strong)",
                    background: isSelected ? "var(--bg-elevated)" : "transparent",
                    textAlign: "left",
                    transition: "all 160ms ease",
                    position: "relative",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <div className="serif" style={{ fontSize: 16, lineHeight: 1.1, marginBottom: 4 }}>
                    {v.title}
                  </div>
                  <div className="mono" style={{ fontSize: 11 }}>
                    {price !== null
                      ? convertToLocale({
                          amount: price,
                          currency_code: variantCurrency(v),
                        })
                      : "—"}
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "var(--rouge)",
                      }}
                    >
                      <LhCheck size={14} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid var(--ink)",
            borderRadius: 999,
          }}
        >
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            style={{ width: 50, height: 56, display: "grid", placeItems: "center" }}
            aria-label="Diminuer la quantité"
          >
            <LhMinus />
          </button>
          <span
            style={{
              width: 32,
              textAlign: "center",
              fontSize: 16,
              fontFamily: "var(--serif)",
            }}
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            style={{ width: 50, height: 56, display: "grid", placeItems: "center" }}
            aria-label="Augmenter la quantité"
          >
            <LhPlus />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedVariant || !inStock || isAdding}
          className="btn btn-rouge"
          style={{
            flex: 1,
            justifyContent: "center",
            padding: "16px 22px",
            opacity: !selectedVariant || !inStock || isAdding ? 0.6 : 1,
            cursor: !selectedVariant || !inStock || isAdding ? "not-allowed" : "pointer",
          }}
          data-testid="add-product-button"
        >
          {isAdding
            ? "Ajout en cours…"
            : !selectedVariant
            ? "Sélectionner un format"
            : !inStock
            ? "Rupture de stock"
            : `Ajouter au panier · ${convertToLocale({
                amount: totalPrice,
                currency_code: currency,
              })}`}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "var(--rouge)", marginBottom: 24 }}>
          {error}
        </p>
      )}
    </div>
  )
}
