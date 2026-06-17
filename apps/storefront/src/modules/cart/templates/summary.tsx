"use client"

import { type HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import { LhArrow, LhTruck } from "@modules/common/components/lehena/icons"
import CartTotals from "@modules/common/components/cart-totals"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const LhLock = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="4" y="10" width="16" height="11" rx="1.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

interface SummaryProps {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        background: "var(--bg-elevated)",
      }}
    >
      <div
        style={{ padding: "22px 24px 16px", borderBottom: "1px solid var(--line)" }}
      >
        <div className="eyebrow">Récapitulatif</div>
      </div>

      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
        <DiscountCode cart={cart} />
      </div>

      <div style={{ padding: "18px 24px 22px" }}>
        <CartTotals totals={cart} />
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
        >
          <button
            className="btn btn-rouge"
            style={{ width: "100%", justifyContent: "center", padding: 16, marginTop: 20 }}
          >
            Passer commande <LhArrow />
          </button>
        </LocalizedClientLink>
      </div>

      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontFamily: "var(--serif)",
            fontSize: 13,
            color: "var(--ink-soft)",
          }}
        >
          <span style={{ color: "var(--rouge)", flexShrink: 0 }}>
            <LhTruck size={16} />
          </span>
          Livraison fraîche Chronofresh en 24–48 h
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontFamily: "var(--serif)",
            fontSize: 13,
            color: "var(--ink-soft)",
          }}
        >
          <span style={{ color: "var(--rouge)", flexShrink: 0 }}>
            <LhLock size={15} />
          </span>
          Paiement chiffré · aucune donnée carte stockée
        </div>
      </div>
    </div>
  )
}

export default Summary
