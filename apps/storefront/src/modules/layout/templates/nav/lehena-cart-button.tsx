"use client"

import { LhBag } from "@modules/common/components/lehena/icons"
import { useCartDrawer } from "@modules/layout/components/cart-drawer/cart-drawer-context"

export default function LehenaCartButton() {
  const { setOpen, count } = useCartDrawer()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="header-cart"
      aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}
      data-testid="nav-cart-link"
    >
      <LhBag size={16} />
      <span
        style={{
          fontSize: 12,
          fontFamily: "var(--mono)",
          letterSpacing: "0.08em",
        }}
      >
        {count}
      </span>
    </button>
  )
}
