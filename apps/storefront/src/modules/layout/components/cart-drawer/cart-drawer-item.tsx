"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { LhClose, LhMinus, LhPlus } from "@modules/common/components/lehena/icons"
import { Placeholder } from "@modules/common/components/lehena/primitives"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useCartDrawer } from "./cart-drawer-context"

export default function CartDrawerItem({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) {
  const { setOpen, justAddedKey } = useCartDrawer()
  const [isPending, startTransition] = useTransition()
  const [optimisticQty, setOptimisticQty] = useState(item.quantity)

  const update = (next: number) => {
    if (next < 1) {
      startTransition(async () => {
        await deleteLineItem(item.id).catch(() => {})
      })
      return
    }
    setOptimisticQty(next)
    startTransition(async () => {
      await updateLineItem({ lineId: item.id, quantity: next }).catch(() => {
        setOptimisticQty(item.quantity)
      })
    })
  }

  const remove = () => {
    startTransition(async () => {
      await deleteLineItem(item.id).catch(() => {})
    })
  }

  const isJustAdded = justAddedKey === item.id
  const thumb = item.thumbnail || item.variant?.product?.images?.[0]?.url

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 0",
        borderBottom: "1px solid var(--line)",
        animation: isJustAdded ? "lh-flash 1.2s ease" : "none",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        onClick={() => setOpen(false)}
        style={{ width: 72, height: 72, flexShrink: 0 }}
      >
        {thumb ? (
          <div style={{ position: "relative", width: 72, height: 72, overflow: "hidden" }}>
            <Image
              src={thumb}
              alt={item.product_title || item.title || ""}
              fill
              sizes="72px"
              style={{ objectFit: "cover" }}
            />
          </div>
        ) : (
          <Placeholder
            label={(item.product_title || item.title || "Photo").slice(0, 12)}
            aspect="1/1"
            tone="kraft"
          />
        )}
      </LocalizedClientLink>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            onClick={() => setOpen(false)}
            className="serif-display"
            style={{ fontSize: 16, lineHeight: 1.2, color: "var(--ink)" }}
          >
            {item.product_title || item.title}
          </LocalizedClientLink>
          <button
            type="button"
            onClick={remove}
            style={{ color: "var(--ink-mute)", flexShrink: 0 }}
            aria-label="Retirer"
          >
            <LhClose size={14} />
          </button>
        </div>
        {item.variant?.title && item.variant.title !== "Default" && (
          <div style={{ fontSize: 12, color: "var(--ink-mute)", margin: "4px 0 10px" }}>
            {item.variant.title}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--line-strong)",
              borderRadius: 999,
            }}
          >
            <button
              type="button"
              onClick={() => update(optimisticQty - 1)}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}
              aria-label="Moins"
              disabled={isPending}
            >
              <LhMinus />
            </button>
            <span
              style={{ width: 26, textAlign: "center", fontSize: 13 }}
              data-testid="cart-item-quantity"
            >
              {optimisticQty}
            </span>
            <button
              type="button"
              onClick={() => update(optimisticQty + 1)}
              style={{ width: 28, height: 28, display: "grid", placeItems: "center" }}
              aria-label="Plus"
              disabled={isPending}
            >
              <LhPlus />
            </button>
          </div>
          <div className="serif" style={{ fontSize: 18 }}>
            {convertToLocale({
              amount: item.total ?? item.unit_price * optimisticQty,
              currency_code: currencyCode,
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
